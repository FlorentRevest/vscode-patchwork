import { VSCodeLink, VSCodeProgressRing, VSCodeDivider } from "@vscode/webview-ui-toolkit/react";
import React, { useState, useCallback, useEffect } from "react";
import { Patch } from "../../src/rest-api/Types";
import { EmailView } from "./EmailView";
import { dateFromNow } from "../../src/utilities/dateFromNow";

interface ReplyNode {
  reply: Patch;
  replies: ReplyNode[];
}

function createTree(replies: Patch[]) {
  let msgIdMap: Map<string, ReplyNode> = new Map([]);
  let ret: ReplyNode[] = [];

  replies.forEach((reply: Patch) => {
    msgIdMap.set(reply.msgid.trim(), { reply: reply, replies: [] });
  });

  msgIdMap.forEach((node: ReplyNode) => {
    const parentMsgId = node.reply.headers["In-Reply-To"];
    if (parentMsgId) {
      const parentNode = msgIdMap.get(parentMsgId.trim());
      if (parentNode) {
        parentNode.replies.push(node);
        return;
      }
    }

    ret.push(node);
  });

  return ret;
}

function ReplyView({ node, isDirectReply }: { node: ReplyNode; isDirectReply: boolean }) {
  const replies = node.replies.map((node: ReplyNode) => {
    return <ReplyView key={node.reply.id} node={node} isDirectReply={false} />;
  });

  return (
    <>
      <VSCodeDivider />
      <div className={isDirectReply ? "" : "indented-reply"}>
        <h3>
          <VSCodeLink
            title={node.reply.submitter.email}
            href={"mailto:" + node.reply.submitter.email}>
            {node.reply.submitter.name}
          </VSCodeLink>
          {" replied " + dateFromNow(new Date(node.reply.date))}
        </h3>

        <EmailView email={node.reply} isReply={true} />

        {replies}
      </div>
    </>
  );
}

export const RepliesView = ({ url }: { url: string }) => {
  const [replies, setReplies] = useState<Patch[]>([]);
  const [loading, setLoading] = useState(false);

  // We can't contact REST endpoints from here because Patchwork doesn't support CORS, so we rely on the extension
  const handleMessagesFromExtension = useCallback((event: MessageEvent) => {
    if (event.data.command === "setComments") {
      setLoading(false);
      setReplies(event.data.comments);
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

  useEffect(() => {
    setLoading(true);
    vscode.postMessage({ command: "getComments", url: url });
  }, [url]);

  // We can't contact REST endpoints from here because Patchwork doesn't support CORS, so we rely on the extension
  if (loading) {
    return <VSCodeProgressRing />;
  } else {
    const directReplies = createTree(replies);

    return (
      <div>
        {directReplies.map((node) => (
          <ReplyView key={node.reply.id} node={node} isDirectReply={true} />
        ))}
      </div>
    );
  }
};
