export declare class ClusterService {
    findAndAttachCluster(requestId: number, categoryId: number, latitude: number, longitude: number, citizenId: number): Promise<{
        clustered: boolean;
        clusterId: number | null;
        isParent: boolean;
        clusterSize: number;
    }>;
    calculateFinalPriority(basePriority: number, severityScore: number, clusterSize: number): number;
}
export declare const clusterService: ClusterService;
