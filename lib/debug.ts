export const debugLog = (label: string, data?: any) => {
  console.log(`🟢 [DEBUG] ${label}`);
  if (data) console.log(data);
};

export const debugError = (label: string, error: any) => {
  console.error(`🔴 [ERROR] ${label}`);
  console.error(error);
};