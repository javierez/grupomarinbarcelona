

export interface WatermarkConfig {
  enabled: boolean;
  position: string;
  sizePercentage: number;
  opacity: number;
  logoUrl: string;
}

export const getWatermarkConfig = (_accountIdArg?: bigint): WatermarkConfig => {
  return {
  "enabled": false,
  "position": "southeast",
  "sizePercentage": 30,
  "opacity": 0.8,
  "logoUrl": "https://vesta-crm-prod-eu-e966e353.s3.eu-west-1.amazonaws.com/accounts/141/branding/logo_transparent_1782396573658_Ce5OfR.png"
};
}