export const metadata = {
  title: 'Progressive Optimization of HydraLA-Net for Microaneurysm Segmentation',
  description: 'Research paper submitted to CUCAI 2026 detailing my Wat.AI team\'s project, See-DR. The paper details our entire process, from motivations and methods, to results, and interpretations.',
  alternates: {
    canonical: '/blog/Progressive-Optimization-of-HydraLA-Net-for-Microaneurysm-Segmentation',
  },
}

export default function ResearchPaper() {
  return (
    <div className="flex flex-col -mx-4 h-[calc(100vh-5rem)]">
      <div className="mb-3 px-4">
        <h1 className="text-xl font-medium mb-1">
          Progressive Optimization of HydraLA-Net for Microaneurysm Segmentation
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm">
          Research paper submitted to CUCAI 2026
        </p>
      </div>
      <iframe
        src="/pdfs/Progressive_Optimization_of_HydraLA_Net_for_Microaneurysm_Segmentation.pdf"
        className="w-full h-full border-t border-zinc-200 dark:border-zinc-800"
        title="Research Paper PDF"
      />
    </div>
  )
}
