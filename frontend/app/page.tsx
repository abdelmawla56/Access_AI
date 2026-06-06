"use client";

import dynamic from "next/dynamic";

const HomePageComponent = dynamic(() => import("./HomePageComponent"), {
  ssr: false,
});

export default function Page() {
  return <HomePageComponent />;
}
