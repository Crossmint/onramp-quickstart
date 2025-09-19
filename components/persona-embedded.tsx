"use client";

import React, { useEffect, useState } from "react";

type PersonaConfig = {
  templateId: string;
  referenceId: string;
  environmentId: string;
};

type Props = {
  config: PersonaConfig;
  onComplete: () => void;
  onError?: (e: Error) => void;
};

export default function PersonaEmbedded({ config, onComplete, onError }: Props) {
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    let stop = false;

    (async () => {
      if (stop) return;
    
      const { Client } = await import("persona");
      
      const client = new Client({
        templateId: config.templateId,
        referenceId: config.referenceId,
        environmentId: config.environmentId,
        onReady: () => {
          client.open();
          setIsReady(true);
        },
        onComplete: () => {
          onComplete();
        },
        onCancel: () => {},
        onError: (e: any) => onError?.(new Error(String(e?.message || e))),
      });
    })();

    return () => {
      stop = true;
    };
  }, [config, onComplete, onError]);

  return (
    <>
      {!isReady && <div>Loading...</div>}
      <div id="persona-container"/>
    </>
  );
}


