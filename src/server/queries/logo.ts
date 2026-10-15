

export const getLogo = (_accountIdArg?: bigint): string | null => {
  return "https://vesta-crm-prod-eu-e966e353.s3.eu-west-1.amazonaws.com/accounts/141/branding/logo_black_1792054048598.png";
}

/**
 * Icono cuadrado de la pestaña (`website_config.favicon`). El logo suele ser
 * apaisado y a 16 px queda en una raya invisible (grupomarinccm.com), así que
 * cuando hay favicon propio manda él.
 */
export const getFavicon = (_accountIdArg?: bigint): string | null => {
  return "https://vesta-crm-prod-eu-e966e353.s3.eu-west-1.amazonaws.com/accounts/141/branding/favicon_gm_1792054048598.png";
}
