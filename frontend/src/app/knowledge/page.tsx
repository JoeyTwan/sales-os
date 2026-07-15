export default function KnowledgePage() {
  return (
    <div className="py-8">
      <div className="bg-card rounded-xl shadow-sm p-12">
        <h1 className="text-2xl font-semibold mb-4">知识库</h1>
        <p className="text-muted-foreground mb-8">点击进入 NotebookLM 查询资料</p>
        <a
          href="https://notebooklm.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          打开 NotebookLM
        </a>
      </div>
    </div>
  );
}
