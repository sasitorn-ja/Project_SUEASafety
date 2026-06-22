"use client";

export const PROFILE_IMAGE_KEY = "suea-safety-profile-image";
export const PROFILE_IMAGE_UPDATED_EVENT = "suea-safety-profile-image-updated";

export function notifyProfileImageUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PROFILE_IMAGE_UPDATED_EVENT));
  }
}
