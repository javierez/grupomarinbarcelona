

export type SocialLink = {
  platform:
    | "facebook"
    | "twitter"
    | "instagram"
    | "linkedin"
    | "youtube"
    | "tiktok";
  url: string;
  previewImage?: string;
};

export const getSocialLinks = (_accountIdArg?: bigint): SocialLink[] => {
  return [{
  "platform": "instagram",
  "url": "https://www.instagram.com/grupomarinccm/",
  "previewImage": "https://vesta-crm-prod-eu-e966e353.s3.eu-west-1.amazonaws.com/accounts/141/website/instagram-preview_1783007775660.png"
}];
}