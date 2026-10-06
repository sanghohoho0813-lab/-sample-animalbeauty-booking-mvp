import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PawBeauty — 반려동물 미용 예약",
    short_name: "PawBeauty",
    description: "우리 아이의 특별한 하루를 위한 반려동물 미용 예약 서비스",
    start_url: "/",
    display: "standalone",
    background_color: "#FCFAF7",
    theme_color: "#FCFAF7",
    lang: "ko",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
