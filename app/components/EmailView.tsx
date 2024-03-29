import { VSCodeButton, VSCodeLink } from "@vscode/webview-ui-toolkit/react";
import React from "react";
import Linkify from "react-linkify";
import { Patch } from "../../src/rest-api/Types";

export const EmailView = ({ email, isReply }: { email: Patch; isReply: boolean }) => {
  // Lay out spans for each line of the email
  let isCoverLetterTail = false;
  const emailContent = email.content.split("\n").map((line, key) => {
    let greyed = false;
    // Grey out quotes previous emails in replies
    if (isReply && line.startsWith(">")) {
      greyed = true;
    } else if (!isReply) {
      // As well as everything after the first --- in cover-letter or patch descriptions
      if (line.trim() === "---") {
        isCoverLetterTail = true;
      }
      greyed = isCoverLetterTail;
    }
    return (
      <span key={key} className={greyed ? "greyed" : ""}>
        {line}
        <br />
      </span>
    );
  });

  return (
    <div>
      <Linkify
        componentDecorator={(decoratedHref: string, decoratedText: string, key: number) => (
          <VSCodeLink href={decoratedHref} key={key}>
            {decoratedText}
          </VSCodeLink>
        )}>
        <p className="email-content">{emailContent}</p>
      </Linkify>
      <a href={email.list_archive_url}>
        <VSCodeButton appearance="secondary" title={email.list_archive_url}>
          <span slot="start" className="codicon codicon-link-external" />
          Open archive
        </VSCodeButton>
      </a>
      &nbsp;
      <VSCodeButton appearance="secondary" title="Reply"
        onClick={() => { vscode.postMessage({ command: "reply", email: email }); }}>
        <span slot="start" className="codicon codicon-reply" />
        Reply
      </VSCodeButton>
    </div>
  );
};
