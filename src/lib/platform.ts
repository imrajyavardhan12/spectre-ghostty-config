export type ClientOS = "macos" | "windows" | "linux" | "other";

export function detectClientOS(): ClientOS {
  if (typeof window === "undefined") return "other";

  const navigatorPlatform = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform;
  const platformString = `${navigatorPlatform ?? ""} ${navigator.platform ?? ""} ${navigator.userAgent ?? ""}`.toLowerCase();

  if (platformString.includes("android")) return "other";
  if (platformString.includes("linux")) return "linux";
  if (platformString.includes("mac") || platformString.includes("darwin")) return "macos";
  if (platformString.includes("win")) return "windows";

  return "other";
}
