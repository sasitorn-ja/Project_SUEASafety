"use client";

export const PROFILE_IMAGE_KEY = "suea-safety-profile-image";

export const MOCK_PROFILE = {
  namePrefixTh: "นางสาว",
  firstNameTh: "ศศิธร",
  lastNameTh: "จรุงจรรยาพงศ์",
  namePrefixEn: "Ms.",
  firstNameEn: "Sasitorn",
  lastNameEn: "Jarungjanyaphong",
  positionTh: "Developer",
  username: "SASITOJA",
  email: "SASITOJA@SCG.COM",
  divisionTh: "RMC Excellence",
  company: "CPAC",
  workLocation: "สำนักงานใหญ่",
} as const;

export function getProfileDisplayName() {
  return `${MOCK_PROFILE.namePrefixTh} ${MOCK_PROFILE.firstNameTh} ${MOCK_PROFILE.lastNameTh}`;
}

export function getProfileInitials() {
  return `${MOCK_PROFILE.firstNameTh.charAt(0) || "U"}${MOCK_PROFILE.lastNameTh.charAt(0) || ""}`;
}
