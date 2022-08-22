import { TitleView } from "./TitleView";
import { PatchView } from "./PatchView";
import { SeriesView } from "./SeriesView";
import { Patch, Series } from "../../src/rest-api/Types";
import { VSCodeDivider, VSCodeProgressRing } from "@vscode/webview-ui-toolkit/react";
import React, { useEffect, useState, useCallback } from "react";

// Patch and Series are interfaces so we can only distinguish them by the existence of fields
function isSeries(content: Patch | Series) {
  return "patches" in content;
}

export const App = () => {
  const [content, setContent] = useState<Series | Patch | undefined>();

  // The will be populated after the webview is live
  const handleMessagesFromExtension = useCallback((event: MessageEvent) => {
    if (event.data.command === "setContent") {
      setContent(event.data.content);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("message", (event: MessageEvent) => {
      handleMessagesFromExtension(event);
    });

    return () => {
      window.removeEventListener("message", handleMessagesFromExtension);
    };
  }, [handleMessagesFromExtension]);

  // Only show something when there is content
  if (content) {
    const contentIsSeries = isSeries(content);
    return (
      <div>
        <TitleView content={content} contentIsSeries={contentIsSeries} />
        <VSCodeDivider />

        {contentIsSeries ? (
          <SeriesView series={content as Series} />
        ) : (
          <PatchView patch={content as Patch} />
        )}
      </div>
    );
  } else {
    return <VSCodeProgressRing />;
  }
};
