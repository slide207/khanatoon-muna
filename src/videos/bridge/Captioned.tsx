// Delivery composition: the clean film plus word-by-word captions and audio narration.
import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { BridgeShort } from "./Bridge";
import { Captions } from "./Captions";

export const BridgeCaptioned: React.FC = () => (
  <AbsoluteFill>
    <BridgeShort />
    <Audio src={staticFile("voice/voice.wav")} />
    <Captions />
  </AbsoluteFill>
);
