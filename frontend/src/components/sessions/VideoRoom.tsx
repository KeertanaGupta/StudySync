import DailyIframe from "@daily-co/daily-js";
import { useEffect, useRef } from "react";

export default function VideoRoom({ url }: { url: string }) {
  const ref = useRef<any>(null);

  useEffect(() => {
    ref.current = DailyIframe.createFrame({
      showLeaveButton: true,
    });

    ref.current.join({ url });

    return () => {
      ref.current?.leave();
    };
  }, [url]);

  return <div id="video-call" style={{ height: "500px" }} />;
}