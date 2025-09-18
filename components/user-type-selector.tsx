"use client";

import React, { useState, useEffect } from "react";
import Tooltip from "@/components/tooltip";

// This email corresponds to a user that has already passed KYC in Staging.
const RETURNING_EMAIL = "demos+onramp-existing-user@crossmint.com";

interface UserTypeSelectorProps {
  userType: "returning" | "new";
  onUserTypeChange: (userType: "returning" | "new", email: string) => void;
}

export default function UserTypeSelector({ userType, onUserTypeChange }: UserTypeSelectorProps) {
  const [newUserEmail, setNewUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (userType === "new" && !newUserEmail) {
      const randomPart = Math.random().toString(36).slice(2, 10);
      setNewUserEmail(`demos+onramp-new-user-${randomPart}@crossmint.com`);
    }
  }, [userType, newUserEmail]);

  const handleUserTypeChange = (newUserType: "returning" | "new") => {
    if (userType !== newUserType) {
      if (newUserType === "new") {
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
      <Tooltip content="Preview the flow for users who have already completed KYC" className="flex-1">
        <button
          className={`w-full px-4 py-2 rounded-lg text-sm text-center ${
            userType === "returning" ? "bg-white shadow-sm" : "text-gray-600"
          }`}
          onClick={() => handleUserTypeChange("returning")}
        >
          Returning user
        </button>
      </Tooltip>
      <Tooltip content="Preview the KYC flow for first-time users" className="flex-1">
        <button
          className={`w-full px-4 py-2 rounded-lg text-sm text-center ${
            userType === "new" ? "bg-white shadow-sm" : "text-gray-600"
          }`}
          onClick={() => handleUserTypeChange("new")}
        >
          New user (KYC)
        </button>
      </Tooltip>
    </div>
  );
}
