import { VSCodeLink } from "@vscode/webview-ui-toolkit/react";
import React from "react";
import { Patch, Series } from "../../src/rest-api/Types";
import { dateFromNow } from "../../src/utilities/dateFromNow";
import { VSCodeBadge, VSCodeButton, VSCodeTag } from "@vscode/webview-ui-toolkit/react";

export const TitleView = ({
  content,
  contentIsSeries,
}: {
  content: Patch | Series;
  contentIsSeries: boolean;
}) => {
  // The patch apply operation is generic to both patches and series
  const apply = () => {
    vscode.postMessage({ command: "apply", mboxUrl: content.mbox });
  };

  // But some fields are only defined by either interfaces
  const patch = content as Patch;
  const series = content as Series;

  return (
    <header>
      <h1>
        <VSCodeBadge title="Series version">
          {"v" + (contentIsSeries ? series.version : patch.series[0].version)}
        </VSCodeBadge>
        <VSCodeLink title={content.web_url} href={content.web_url}>
          {content.name}
        </VSCodeLink>
      </h1>

      <h2>
        sent by{" "}
        <VSCodeLink title={content.submitter.email} href={"mailto:" + content.submitter.email}>
          {content.submitter.name}
        </VSCodeLink>
        {" " + dateFromNow(new Date(content.date)) + " to "}
        <VSCodeLink
          title={content.project.list_email}
          href={"mailto:" + content.project.list_email}>
          {content.project.name}
        </VSCodeLink>
        {contentIsSeries ? (
          <></>
        ) : (
          <>
            {patch.archived ? <VSCodeTag title="Archived">Archived</VSCodeTag> : <></>}
            <VSCodeTag title="State">{patch.state.replace("-", " ")}</VSCodeTag>
            <VSCodeTag title="Checks">{patch.check}</VSCodeTag>
          </>
        )}
      </h2>

      <VSCodeButton onClick={apply}>
        <span slot="start" className="codicon codicon-cloud-download" />
        {contentIsSeries ? "Apply series" : "Apply patch"}
      </VSCodeButton>
    </header>
  );
};
