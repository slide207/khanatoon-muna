// Sandbox entry: renders only src/videos/bridge. Copy this folder to src/sandboxes/<n>/
// and change the import path to your sandbox copy when running a look pass.
import React from "react";
import { Composition, registerRoot } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "../../videos/bridge/Bridge";

const Root: React.FC = () => (
  <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
);
registerRoot(Root);
