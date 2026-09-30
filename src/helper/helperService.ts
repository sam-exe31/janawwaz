import { query, execute } from '../database/db';
import { AppError } from '../common/errors';

export interface CreateHelperDto {
  name: string;
  phone: string;
  latitude: number;
  longitude: number;
  areaLabel?: string;
  photoUrl?: string;
}

export class HelperService {
  async listHelpers(ngoId: number) {
    const rows = await query<any[]>(
      `SELECT id, name, phone, area_label as areaLabel, photo_url as photoUrl, active,
              ST_Latitude(home_location) as latitude, ST_Longitude(home_location) as longitude,
              (SELECT COUNT(*) FROM assignments a WHERE a.helper_id = helpers.id AND a.status IN ('ASSIGNED', 'IN_PROGRESS')) as activeAssignments
       FROM helpers
       WHERE ngo_id = ? AND active = TRUE
       ORDER BY name ASC`,
      [ngoId]
    );

    return rows.map((h) => ({
      ...h,
      latitude: Number(h.latitude),
      longitude: Number(h.longitude),
      active: !!h.active,
      activeAssignments: Number(h.activeAssignments),
    }));
  }

  async createHelper(ngoId: number, dto: CreateHelperDto) {
    const result = await execute(
      `INSERT INTO helpers (ngo_id, name, phone, home_location, area_label, active, photo_url, created_at, updated_at)
       VALUES (?, ?, ?, ST_GeomFromText(?, 4326, 'axis-order=lat-long'), ?, TRUE, ?, NOW(), NOW())`,
      [
        ngoId,
        dto.name,
        dto.phone,
        `POINT(${dto.latitude} ${dto.longitude})`,
        dto.areaLabel || null,
        dto.photoUrl || null,
      ]
    );

    return {
      id: result.insertId,
      name: dto.name,
      message: 'Helper created successfully',
    };
  }

  async updateHelper(ngoId: number, helperId: number, dto: Partial<CreateHelperDto>) {
    const existing = await query<any[]>(
      'SELECT id FROM helpers WHERE id = ? AND ngo_id = ? LIMIT 1',
      [helperId, ngoId]
    );
    if (existing.length === 0) throw AppError.notFound('Helper not found');

    const updates: string[] = ['updated_at = NOW()'];
    const params: any[] = [];

    if (dto.name) {
      updates.push('name = ?');
      params.push(dto.name);
    }
    if (dto.phone) {
      updates.push('phone = ?');
      params.push(dto.phone);
    }
    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      updates.push("home_location = ST_GeomFromText(?, 4326, 'axis-order=lat-long')");
      params.push(`POINT(${dto.latitude} ${dto.longitude})`);
    }
    if (dto.areaLabel !== undefined) {
      updates.push('area_label = ?');
      params.push(dto.areaLabel);
    }
    if (dto.photoUrl !== undefined) {
      updates.push('photo_url = ?');
      params.push(dto.photoUrl);
    }

    params.push(helperId, ngoId);
    await execute(`UPDATE helpers SET ${updates.join(', ')} WHERE id = ? AND ngo_id = ?`, params);

    return { success: true, message: 'Helper updated successfully' };
  }

  async deleteHelper(ngoId: number, helperId: number) {
    const existing = await query<any[]>(
      'SELECT id FROM helpers WHERE id = ? AND ngo_id = ? LIMIT 1',
      [helperId, ngoId]
    );
    if (existing.length === 0) throw AppError.notFound('Helper not found');

    // Soft delete via active = false
    await execute('UPDATE helpers SET active = FALSE, updated_at = NOW() WHERE id = ? AND ngo_id = ?', [
      helperId,
      ngoId,
    ]);

    return { success: true, message: 'Helper deactivated successfully' };
  }
}

export const helperService = new HelperService();
