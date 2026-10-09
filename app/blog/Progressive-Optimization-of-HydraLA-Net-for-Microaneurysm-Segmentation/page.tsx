export const metadata = {
  title: 'Progressive Optimization of HydraLA-Net for Microaneurysm Segmentation',
  description: 'Research paper submitted to CUCAI 2026 detailing my Wat.AI team\'s project, See-DR. The paper details our entire process, from motivations and methods, to results, and interpretations.',
  alternates: {
    canonical: '/blog/Progressive-Optimization-of-HydraLA-Net-for-Microaneurysm-Segmentation',
  },
}

export default function ResearchPaper() {
  return (
    <div className="not-prose flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight mb-1">
          Progressive Optimization of HydraLA-Net for Microaneurysm Segmentation
        </h1>
        <p className="text-muted text-sm">
          Research paper submitted to CUCAI 2026
        </p>
      </div>
      <iframe
        src="/pdfs/Progressive_Optimization_of_HydraLA_Net_for_Microaneurysm_Segmentation.pdf"
        className="w-full h-full border-t border-rule rounded-xl border"
        title="Research Paper PDF"
      />
    </div>
  )
}
