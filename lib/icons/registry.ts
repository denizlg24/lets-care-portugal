import "server-only";

import type { IconType } from "react-icons";
import * as fa6 from "react-icons/fa6";

/**
 * Resolves a stored icon name (a `react-icons/fa6` export, e.g. "FaFacebook")
 * to its component. Server-only: the full icon pack lives in the server
 * bundle and rendered icons reach the client as inline SVG, not JS. Client
 * code renders stored icons with `components/icons/fa-icon` instead.
 */
export function getFaIcon(name: string): IconType | null {
  const icon = (fa6 as Record<string, unknown>)[name];
  return typeof icon === "function" ? (icon as IconType) : null;
}
