import Panel from "@/components/mml/Panel";

export default function Placeholder({ title }) {
  return (
    <Panel style={{ left: 690, top: 130, width: 1100, height: 830, padding: "10px 24px" }} title={title}>
      <p className="cfdesc" style={{ marginTop: 16 }}>This screen is part of MML MergeCommand but not implemented in this preview build. It will be available in the desktop app.</p>
    </Panel>
  );
}