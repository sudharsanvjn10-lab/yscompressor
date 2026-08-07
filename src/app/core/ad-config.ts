export interface AdConfig {
  enabled: boolean;
  publisherId: string; // Placeholder value for site owner
  networkName: string;
}

export const DEFAULT_AD_CONFIG: AdConfig = {
  enabled: true,
  publisherId: 'ca-pub-placeholder-123456',
  networkName: 'GenericAdNetwork'
};
