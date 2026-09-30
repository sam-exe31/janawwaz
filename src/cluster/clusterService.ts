import { query, execute } from '../database/db';
import { config } from '../config';
import { notificationService } from '../notification/notificationService';

export class ClusterService {
  async findAndAttachCluster(
    requestId: number,
    categoryId: number,
    latitude: number,
    longitude: number,
    citizenId: number
  ): Promise<{ clustered: boolean; clusterId: number | null; isParent: boolean; clusterSize: number }> {
    const radiusMeters = config.cluster.radiusMeters; // default 100m

    // Search for existing active requests with same category within radius using ST_Distance_Sphere
    const matches = await query<any[]>(
      `SELECT r.id, r.cluster_id as clusterId, r.is_cluster_parent as isClusterParent,
              r.final_priority as finalPriority,
              ST_Distance_Sphere(r.location, ST_GeomFromText(?, 4326, 'axis-order=lat-long')) as distance
       FROM requests r
       WHERE r.category_id = ?
         AND r.id != ?
         AND r.status NOT IN ('CLOSED', 'REJECTED_FAKE')
         AND ST_Distance_Sphere(r.location, ST_GeomFromText(?, 4326, 'axis-order=lat-long')) <= ?
       ORDER BY r.created_at ASC
       LIMIT 1`,
      [
        `POINT(${latitude} ${longitude})`,
        categoryId,
        requestId,
        `POINT(${latitude} ${longitude})`,
        radiusMeters,
      ]
    );

    if (matches.length === 0) {
      // No duplicate nearby. Request stands alone
      return { clustered: false, clusterId: null, isParent: false, clusterSize: 1 };
    }

    const matched = matches[0];
    let clusterId = matched.clusterId;
    let newSize = 2;

    if (!clusterId) {
      // Create first cluster: parent is the older matched request
      const clusterResult = await execute(
        `INSERT INTO request_clusters (category_id, parent_request_id, size, center, created_at)
         VALUES (?, ?, 2, ST_GeomFromText(?, 4326, 'axis-order=lat-long'), NOW())`,
        [categoryId, matched.id, `POINT(${latitude} ${longitude})`]
      );

      clusterId = clusterResult.insertId;

      // Update parent request
      await execute(
        `UPDATE requests SET cluster_id = ?, is_cluster_parent = TRUE WHERE id = ?`,
        [clusterId, matched.id]
      );
    } else {
      // Increment existing cluster size
      await execute(
        `UPDATE request_clusters SET size = size + 1 WHERE id = ?`,
        [clusterId]
      );
      const clusterRows = await query<any[]>(
        'SELECT size FROM request_clusters WHERE id = ?',
        [clusterId]
      );
      newSize = clusterRows.length > 0 ? clusterRows[0].size : 2;
    }

    // Attach child request to cluster
    await execute(
      `UPDATE requests SET cluster_id = ?, is_cluster_parent = FALSE WHERE id = ?`,
      [clusterId, requestId]
    );

    // Notify citizen that a similar report was found and merged into a cluster
    await notificationService.notify({
      userId: citizenId,
      type: 'STATUS_CHANGE',
      title: 'Similar Report Found',
      body: `Your report has been linked with an existing cluster of reports nearby. Multiple citizen reports elevate resolution priority!`,
      requestId,
    });

    return { clustered: true, clusterId, isParent: false, clusterSize: newSize };
  }

  calculateFinalPriority(
    basePriority: number,
    severityScore: number,
    clusterSize: number
  ): number {
    const wCat = config.screening.priorityWeights.category; // 0.40
    const wSev = config.screening.priorityWeights.severity; // 0.40
    const wClust = config.screening.priorityWeights.cluster; // 0.20
    const maxClust = config.cluster.maxSizeForPriority; // 10

    const clusterScore = (Math.min(clusterSize, maxClust) / maxClust) * 100;
    const rawPriority = wCat * basePriority + wSev * severityScore + wClust * clusterScore;

    return Math.min(100, Math.max(0, Number(rawPriority.toFixed(2))));
  }
}

export const clusterService = new ClusterService();
