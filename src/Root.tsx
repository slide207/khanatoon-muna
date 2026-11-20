import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { BridgeCaptioned } from "./videos/bridge/Captioned";

// 1080x1920 at 30 fps. The final export is upscaled to 1440x2560.
// BridgeShort = clean master, BridgeCaptioned = delivery version with word captions.
export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="BridgeShort"
      component={BridgeShort}
      durationInFrames={BRIDGE_FRAMES}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition
      id="BridgeShortCaptioned"
      component={BridgeCaptioned}
      durationInFrames={BRIDGE_FRAMES}
      fps={30}
      width={1080}
      height={1920}
    />
  </>
);
