import { PoolConnection } from 'mysql2/promise';
import { withTransaction, getDbPool } from '../database/db';
import { AppError } from '../common/errors';
import { Role } from '../auth/types';
import { notificationService } from '../notification/notificationService';

export type RequestStatus =
  | 'SUBMITTED'
  | 'SCREENING'
  | 'OPEN'
  | 'NEEDS_ADMIN_REVIEW'
  | 'REJECTED_FAKE'
  | 'CLAIMED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CLOSED'
  | 'REJECTED_BY_NGO'
  | 'ADMIN_IN_PROGRESS';

export interface StateMachineActor {
  id: number | null;
  role: Role | 'SYSTEM';
  isVolunteer?: boolean;
}

export interface TransitionOptions {
  note?: string;
  extra?: {
    handledByAdminId?: number;
    claimId?: number;
    approvedBudget?: number;
    aiFlags?: string[];
  };
}

export class RequestStateMachine {
  async transition(
    requestId: number,
    toStatus: RequestStatus,
    actor: StateMachineActor,
    options: TransitionOptions = {},
    existingConn?: PoolConnection
  ) {
    if (existingConn) {
      return this.executeTransition(existingConn, requestId, toStatus, actor, options);
    }

    return withTransaction(async (conn) => {
      return this.executeTransition(conn, requestId, toStatus, actor, options);
    });
  }

  private async executeTransition(
    conn: PoolConnection,
    requestId: number,
    toStatus: RequestStatus,
    actor: StateMachineActor,
    options: TransitionOptions
  ) {
    // 1. Lock the request row (SELECT ... FOR UPDATE)
    const [rows]: any = await conn.query('SELECT * FROM requests WHERE id = ? FOR UPDATE', [
      requestId,
    ]);

    if (!rows || rows.length === 0) {
      throw AppError.notFound(`Request with id ${requestId} not found`);
    }

    const request = rows[0];
    const fromStatus: RequestStatus = request.status;

    // Terminal states cannot transition out (except REJECTED_FAKE -> NEEDS_ADMIN_REVIEW by admin appeal)
    if (fromStatus === 'CLOSED') {
      throw new AppError(409, 'ILLEGAL_TRANSITION', 'Closed requests cannot undergo state transitions');
    }

    // 2. Validate transition against the state machine table
    this.validateTransition(fromStatus, toStatus, actor, options, request);

    // 3. Side effects and guards validation
    await this.applyGuards(conn, requestId, fromStatus, toStatus, actor, options);

    // 4. Update request row
    const updates: string[] = ['status = ?'];
    const params: any[] = [toStatus];

    if (toStatus === 'CLOSED') {
      updates.push('closed_at = NOW()');
    }

    if (toStatus === 'ADMIN_IN_PROGRESS' && actor.role === 'ADMIN' && actor.id) {
      updates.push('handled_by_admin_id = ?');
      params.push(actor.id);
    }

    params.push(requestId);
    await conn.query(`UPDATE requests SET ${updates.join(', ')} WHERE id = ?`, params);

    // 5. Append request_status_history row
    await conn.query(
      `INSERT INTO request_status_history (request_id, from_status, to_status, actor_id, actor_role, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        requestId,
        fromStatus,
        toStatus,
        actor.id || null,
        actor.role,
        options.note || null,
      ]
    );

    // 6. Append audit_log row
    await conn.query(
      `INSERT INTO audit_log (actor_id, actor_role, action, entity_type, entity_id, before_json, after_json, created_at)
       VALUES (?, ?, ?, 'REQUEST', ?, ?, ?, NOW())`,
      [
        actor.id || null,
        actor.role,
        `TRANSITION_${fromStatus}_TO_${toStatus}`,
        requestId,
        JSON.stringify({ status: fromStatus }),
        JSON.stringify({ status: toStatus, note: options.note }),
      ]
    );

    // 7. If cluster parent reaches CLOSED, close all children in the same transaction
    if (toStatus === 'CLOSED' && request.is_cluster_parent && request.cluster_id) {
      const [childRows]: any = await conn.query(
        `SELECT id FROM requests WHERE cluster_id = ? AND id != ? AND status != 'CLOSED'`,
        [request.cluster_id, requestId]
      );

      for (const child of childRows) {
        await conn.query(`UPDATE requests SET status = 'CLOSED', closed_at = NOW() WHERE id = ?`, [
          child.id,
        ]);
        await conn.query(
          `INSERT INTO request_status_history (request_id, from_status, to_status, actor_id, actor_role, note, created_at)
           VALUES (?, ?, 'CLOSED', ?, ?, 'Closed automatically with cluster parent', NOW())`,
          [child.id, fromStatus, actor.id || null, actor.role]
        );
      }
    }

    // 8. Create notifications
    this.createNotifications(request, fromStatus, toStatus, actor, options.note);

    return {
      requestId,
      fromStatus,
      toStatus,
      success: true,
    };
  }

  private validateTransition(
    from: RequestStatus,
    to: RequestStatus,
    actor: StateMachineActor,
    options: TransitionOptions,
    request: any
  ) {
    // Admin override: any non-terminal -> CLOSED
    if (to === 'CLOSED' && actor.role === 'ADMIN') {
      if (!options.note) {
        throw new AppError(400, 'VALIDATION_FAILED', 'Note is mandatory for admin status override');
      }
      return;
    }

    const ruleKey = `${from}->${to}`;

    switch (ruleKey) {
      // 1. SUBMITTED -> SCREENING (system)
      case 'SUBMITTED->SCREENING':
        if (actor.role !== 'SYSTEM') this.illegal(from, to, 'Only SYSTEM can start screening pipeline');
        return;

      // 2. SCREENING -> OPEN (system)
      case 'SCREENING->OPEN':
        if (actor.role !== 'SYSTEM') this.illegal(from, to, 'Only SYSTEM can complete screening to OPEN');
        return;

      // 3. SCREENING -> NEEDS_ADMIN_REVIEW (system)
      case 'SCREENING->NEEDS_ADMIN_REVIEW':
        if (actor.role !== 'SYSTEM') this.illegal(from, to, 'Only SYSTEM can route screening to admin review');
        return;

      // 4. SCREENING -> REJECTED_FAKE (system)
      case 'SCREENING->REJECTED_FAKE':
        if (actor.role !== 'SYSTEM') this.illegal(from, to, 'Only SYSTEM can auto-reject as fake');
        return;

      // 5. NEEDS_ADMIN_REVIEW -> OPEN (admin)
      case 'NEEDS_ADMIN_REVIEW->OPEN':
        if (actor.role !== 'ADMIN') this.illegal(from, to, 'Only ADMIN can approve request to OPEN');
        if (!options.note) throw new AppError(400, 'VALIDATION_FAILED', 'Note required for admin approval');
        return;

      // 6. NEEDS_ADMIN_REVIEW -> REJECTED_FAKE (admin)
      case 'NEEDS_ADMIN_REVIEW->REJECTED_FAKE':
        if (actor.role !== 'ADMIN') this.illegal(from, to, 'Only ADMIN can mark request as fake');
        if (!options.note) throw new AppError(400, 'VALIDATION_FAILED', 'Note required for admin rejection');
        return;

      // 7. REJECTED_FAKE -> NEEDS_ADMIN_REVIEW (admin reversal)
      case 'REJECTED_FAKE->NEEDS_ADMIN_REVIEW':
        if (actor.role !== 'ADMIN') this.illegal(from, to, 'Only ADMIN can reverse fake rejection on appeal');
        if (!options.note) throw new AppError(400, 'VALIDATION_FAILED', 'Note required for reversal');
        return;

      // 8. OPEN -> CLAIMED (ngo)
      case 'OPEN->CLAIMED':
        if (actor.role !== 'NGO') this.illegal(from, to, 'Only NGO can claim an OPEN request');
        return;

      // 9. OPEN -> REJECTED_BY_NGO (system: threshold reached)
      case 'OPEN->REJECTED_BY_NGO':
        if (actor.role !== 'SYSTEM') this.illegal(from, to, 'Only SYSTEM can trigger REJECTED_BY_NGO transition');
        return;

      // 10. OPEN -> COMPLETED (verified citizen volunteer)
      case 'OPEN->COMPLETED':
        if (actor.role !== 'CITIZEN' || !actor.isVolunteer) {
          this.illegal(from, to, 'Only verified citizen volunteers can mark OPEN request COMPLETED');
        }
        if (!options.note) throw new AppError(400, 'VALIDATION_FAILED', 'Volunteer note is required');
        return;

      // 11. CLAIMED -> ASSIGNED (ngo)
      case 'CLAIMED->ASSIGNED':
        if (actor.role !== 'NGO') this.illegal(from, to, 'Only NGO can assign a claimed request');
        return;

      // 12. ASSIGNED -> IN_PROGRESS (ngo)
      case 'ASSIGNED->IN_PROGRESS':
        if (actor.role !== 'NGO') this.illegal(from, to, 'Only NGO can mark request IN_PROGRESS');
        return;

      // 13. IN_PROGRESS -> COMPLETED (ngo)
      case 'IN_PROGRESS->COMPLETED':
        if (actor.role !== 'NGO') this.illegal(from, to, 'Only NGO can mark work COMPLETED');
        return;

      // 14. COMPLETED -> CLOSED (admin)
      case 'COMPLETED->CLOSED':
        if (actor.role !== 'ADMIN') this.illegal(from, to, 'Only ADMIN can verify and CLOSE request');
        return;

      // 15. COMPLETED -> IN_PROGRESS (admin rejects proof)
      case 'COMPLETED->IN_PROGRESS':
        if (actor.role !== 'ADMIN') this.illegal(from, to, 'Only ADMIN can return COMPLETED request to IN_PROGRESS');
        if (!options.note) throw new AppError(400, 'VALIDATION_FAILED', 'Note is required when rejecting proof');
        return;

      // 16. CLAIMED / ASSIGNED / IN_PROGRESS -> REJECTED_BY_NGO (ngo abandon or admin NGO deactivation)
      case 'CLAIMED->REJECTED_BY_NGO':
      case 'ASSIGNED->REJECTED_BY_NGO':
      case 'IN_PROGRESS->REJECTED_BY_NGO':
        if (actor.role !== 'NGO' && actor.role !== 'ADMIN') {
          this.illegal(from, to, 'Only NGO or ADMIN can transition claim to REJECTED_BY_NGO');
        }
        if (!options.note) throw new AppError(400, 'VALIDATION_FAILED', 'Reason is required');
        return;

      // 17. CLAIMED / ASSIGNED / IN_PROGRESS -> OPEN (admin release)
      case 'CLAIMED->OPEN':
      case 'ASSIGNED->OPEN':
      case 'IN_PROGRESS->OPEN':
        if (actor.role !== 'ADMIN') this.illegal(from, to, 'Only ADMIN can release active claim back to OPEN');
        if (!options.note) throw new AppError(400, 'VALIDATION_FAILED', 'Release note is required');
        return;

      // 18. REJECTED_BY_NGO -> OPEN (admin)
      case 'REJECTED_BY_NGO->OPEN':
        if (actor.role !== 'ADMIN') this.illegal(from, to, 'Only ADMIN can return request to OPEN pool');
        return;

      // 19. REJECTED_BY_NGO -> ADMIN_IN_PROGRESS (admin takes over)
      case 'REJECTED_BY_NGO->ADMIN_IN_PROGRESS':
        if (actor.role !== 'ADMIN') this.illegal(from, to, 'Only ADMIN can take over request');
        return;

      // 20. ADMIN_IN_PROGRESS -> CLOSED (admin completes takeover)
      case 'ADMIN_IN_PROGRESS->CLOSED':
        if (actor.role !== 'ADMIN') this.illegal(from, to, 'Only ADMIN can close taken-over request');
        return;

      default:
        this.illegal(from, to, `Transition from ${from} to ${to} is not permitted.`);
    }
  }

  private async applyGuards(
    conn: PoolConnection,
    requestId: number,
    from: RequestStatus,
    to: RequestStatus,
    actor: StateMachineActor,
    options: TransitionOptions
  ) {
    // Guard 1: IN_PROGRESS -> COMPLETED by NGO requires at least one BEFORE and one AFTER photo
    if (from === 'IN_PROGRESS' && to === 'COMPLETED' && actor.role === 'NGO') {
      const [photos]: any = await conn.query(
        `SELECT kind, COUNT(*) as count FROM request_photos WHERE request_id = ? GROUP BY kind`,
        [requestId]
      );

      const kinds = new Set(photos.map((p: any) => p.kind));
      if (!kinds.has('BEFORE') || !kinds.has('AFTER')) {
        throw new AppError(
          422,
          'PROOF_PHOTOS_REQUIRED',
          'At least one BEFORE photo and one AFTER photo are required to mark work completed.'
        );
      }
    }

    // Guard 2: OPEN -> COMPLETED by Volunteer requires an AFTER proof photo
    if (from === 'OPEN' && to === 'COMPLETED' && actor.role === 'CITIZEN') {
      const [afterPhotos]: any = await conn.query(
        `SELECT id FROM request_photos WHERE request_id = ? AND kind = 'AFTER' LIMIT 1`,
        [requestId]
      );
      if (afterPhotos.length === 0) {
        throw new AppError(
          422,
          'PROOF_PHOTOS_REQUIRED',
          'An AFTER proof photo is required for volunteer resolution.'
        );
      }
    }

    // Guard 3: ADMIN_IN_PROGRESS -> CLOSED requires AFTER proof photo
    if (from === 'ADMIN_IN_PROGRESS' && to === 'CLOSED') {
      const [afterPhotos]: any = await conn.query(
        `SELECT id FROM request_photos WHERE request_id = ? AND kind = 'AFTER' LIMIT 1`,
        [requestId]
      );
      if (afterPhotos.length === 0) {
        throw new AppError(
          422,
          'PROOF_PHOTOS_REQUIRED',
          'An AFTER proof photo is required to close an admin-taken request.'
        );
      }
    }
  }

  private illegal(from: string, to: string, message: string): never {
    throw new AppError(409, 'ILLEGAL_TRANSITION', `Illegal transition from ${from} to ${to}: ${message}`);
  }

  private createNotifications(
    request: any,
    from: RequestStatus,
    to: RequestStatus,
    actor: StateMachineActor,
    note?: string
  ) {
    // Notify citizen of status changes
    if (request.citizen_id) {
      notificationService.notify({
        userId: request.citizen_id,
        type: 'STATUS_CHANGE',
        title: `Request Status Updated: ${to}`,
        body: `Your request #${request.id} changed status from ${from} to ${to}.${note ? ` Note: ${note}` : ''}`,
        requestId: request.id,
      }).catch(console.error);
    }
  }
}

export const requestStateMachine = new RequestStateMachine();
