export interface UserProfile {
  name?: string;
  email?: string;
  phone?: string;
  gender?: string;
  birthdate?: string;
  country?: string;
  address?: string;
  languages?: string;
  hobbies?: string;
  aboutMe?: string;
  experience?: string;
  avatarUrl?: string;
  idVerificationUrl?: string;
  idVerificationStatus?: string;
}

export function calculateProfileCompleteness(profile: UserProfile): { percentage: number; missing: string[] } {
  const fields: { key: keyof UserProfile; label: string; required?: boolean }[] = [
    { key: "name", label: "Full Name", required: true },
    { key: "email", label: "Email Address", required: true },
    { key: "phone", label: "Phone Number", required: true },
    { key: "avatarUrl", label: "Profile Picture" },
    { key: "gender", label: "Gender" },
    { key: "birthdate", label: "Birthdate" },
    { key: "country", label: "Country" },
    { key: "address", label: "Address" },
    { key: "idVerificationUrl", label: "ID Verification" },
  ];

  const missing: string[] = [];
  let filled = 0;

  for (const field of fields) {
    const value = profile[field.key];
    const hasValue = typeof value === "string" ? value.trim().length > 0 : !!value;
    if (hasValue) {
      filled++;
    } else if (field.required) {
      missing.push(field.label);
    }
  }

  const percentage = Math.round((filled / fields.length) * 100);
  return { percentage, missing };
}
