"use client";

import React, { useState, useEffect } from "react";

// This email corresponds to a user that has already passed KYC in Staging.
// You can modify it to test the KYC flow (which this code already supports).
const RETURNING_EMAIL = "demos+onramp-existing-user@crossmint.com";

interface UserTypeSelectorProps {
  userType: "returning" | "new";
  onUserTypeChange: (userType: "returning" | "new", email: string) => void;
}

export default function UserTypeSelector({ userType, onUserTypeChange }: UserTypeSelectorProps) {
  const [newUserEmail, setNewUserEmail] = useState<string | null>(null);

  // Generate a stable random email when switching to New user
  useEffect(() => {
    if (userType === "new" && !newUserEmail) {
      const randomPart = Math.random().toString(36).slice(2, 10);
      setNewUserEmail(`demos+onramp-new-user-${randomPart}@crossmint.com`);
    }
  }, [userType, newUserEmail]);

  const handleUserTypeChange = (newUserType: "returning" | "new") => {
    if (userType !== newUserType) {
      if (newUserType === "new") {
        // regenerate a new email if switching to new user
        const randomPart = Math.random().toString(36).slice(2, 10);
        const email = `demos+onramp-new-user-${randomPart}@crossmint.com`;
        setNewUserEmail(email);
        onUserTypeChange(newUserType, email);
      } else {
        onUserTypeChange(newUserType, RETURNING_EMAIL);
      }
    }
  };

  return (
    <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1 mb-4">
      <button
        className={`flex-1 px-4 py-2 rounded-lg text-sm text-center ${
          userType === "returning" ? "bg-white shadow-sm" : "text-gray-600"
        }`}
        onClick={() => handleUserTypeChange("returning")}
      >
        Returning user
      </button>
      <button
        className={`flex-1 px-4 py-2 rounded-lg text-sm text-center ${
          userType === "new" ? "bg-white shadow-sm" : "text-gray-600"
        }`}
        onClick={() => handleUserTypeChange("new")}
      >
        New user (KYC)
      </button>
    </div>
  );
}
