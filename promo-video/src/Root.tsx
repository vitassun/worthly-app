import React from "react";
import { Composition } from "remotion";
import { WorthlyPromo } from "./WorthlyPromo";
import { FPS, TOTAL_FRAMES } from "./timeline";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="WorthlyPromo16x9"
    component={WorthlyPromo}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
