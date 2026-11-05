import type { ReactNode } from "react";
import { GripVertical } from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";

interface WorkspaceLayoutProps {
  desktop: boolean;
  schemaPanel: ReactNode;
  inputsPanel: ReactNode;
  resultPanel: ReactNode;
}

export function WorkspaceLayout({
  desktop,
  schemaPanel,
  inputsPanel,
  resultPanel,
}: WorkspaceLayoutProps) {
  return desktop ? (
    <div className="workspace-group">
      <Group
        id="protobuf-workspace"
        orientation="horizontal"
        resizeTargetMinimumSize={{ coarse: 28, fine: 14 }}
      >
        <Panel id="schema-panel" defaultSize="34%" minSize="23%">
          {schemaPanel}
        </Panel>
        <Separator
          aria-label="Resize schema and message panels"
          aria-describedby="resize-help"
          className="workspace-separator"
        >
          <GripVertical className="size-3.5" aria-hidden="true" />
        </Separator>
        <Panel id="inputs-panel" defaultSize="34%" minSize="25%">
          {inputsPanel}
        </Panel>
        <Separator
          aria-label="Resize message and result panels"
          aria-describedby="resize-help"
          className="workspace-separator"
        >
          <GripVertical className="size-3.5" aria-hidden="true" />
        </Separator>
        <Panel id="result-panel" defaultSize="32%" minSize="22%">
          {resultPanel}
        </Panel>
      </Group>
    </div>
  ) : (
    <div className="grid gap-5">
      {schemaPanel}
      {inputsPanel}
      {resultPanel}
    </div>
  );
}
