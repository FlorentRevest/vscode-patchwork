import { RepliesView } from "./RepliesView";
import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Patch, Series } from "../../src/rest-api/Types";
import { EmailView } from "./EmailView";
import { VSCodeDivider, VSCodeProgressRing } from "@vscode/webview-ui-toolkit/react";

export const SeriesView = ({ series }: { series: Series }) => {
  // The cover letter isn't immediately available so we need to download it and have a placeholder
  const emptyCoverLetter = useMemo(() => {
    return {
      id: 0,
      project: {
        id: 1,
        url: "",
        name: "",
        link_name: "",
        list_id: "",
        list_email: "",
        web_url: "",
        scm_url: "",
        webscm_url: "",
        list_archive_url: "",
        list_archive_url_format: "",
        commit_url_format: "",
      },
      commit_ref: "",
      pull_url: "",
      state: "",
      archived: false,
      hash: "",
      submitter: {
        id: 2,
        url: "",
        name: "",
        email: "",
      },
      delegate: {
        id: 3,
        url: "",
        username: "",
        first_name: "",
        last_name: "",
        email: "",
      },
      series: [],
      comments: "",
      check: "",
      checks: "",
      tags: [],
      related: [],
      headers: {},
      content: "",
      diff: "",
      prefixes: [],
      url: "",
      web_url: "",
      msgid: "",
      list_archive_url: "",
      date: "",
      name: "",
      mbox: "",
    };
  }, []);
  const [coverLetter, setCoverLetter] = useState<Patch>(emptyCoverLetter);
  const [loading, setLoading] = useState(false);

  const handleSetCoverLetter = useCallback((event: MessageEvent) => {
    if (event.data.command === "setCoverLetter") {
      setLoading(false);
      setCoverLetter(event.data.cover_letter);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("message", (event: MessageEvent) => {
      handleSetCoverLetter(event);
    });

    return () => {
      window.removeEventListener("message", handleSetCoverLetter);
    };
  }, [handleSetCoverLetter]);

  useEffect(() => {
    setCoverLetter(emptyCoverLetter);
    if (series.cover_letter) {
      setLoading(true);
      vscode.postMessage({ command: "getCoverLetter", url: series.cover_letter.url });
    }
  }, [series.cover_letter, emptyCoverLetter]);

  if (loading) {
    return <VSCodeProgressRing />;
  } else {
    return (
      <div>
        <EmailView email={coverLetter} isReply={false} />
        <RepliesView url={coverLetter.comments} />
      </div>
    );
  }
};
