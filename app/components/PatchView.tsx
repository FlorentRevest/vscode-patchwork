import { RepliesView } from "./RepliesView";
import { DiffView } from "./DiffView";
import React from "react";
import { Patch } from "../../src/rest-api/Types";
import { EmailView } from "./EmailView";

export const PatchView = ({ patch }: { patch: Patch }) => {
  return (
    <div>
      <EmailView email={patch} isReply={false} />
      <DiffView diffText={patch.diff} />
      <RepliesView url={patch.comments} />
    </div>
  );
};
