export type Project = {
  name: string
  area: string
  description: string
  stack: string[]
  link?: string
  linkLabel?: string
  status?: string
}

export type ShortProject = {
  name: string
  description: string
  link: string
}

export type WorkExperience = {
  company: string
  title: string
  detail: string
  start: string
  end: string
  link?: string
  current?: boolean
}

export type NowItem = {
  title: string
  context: string
  description: string
}

export type BlogPost = {
  title: string
  kind: string
  description: string
  link: string
}

export type SocialLink = {
  label: string
  link: string
}

export const NOW: NowItem[] = [
  {
    title: 'Graph neural networks for autism genetics',
    context: 'Co-op at The Centre for Applied Genomics, SickKids, fall 2026',
    description:
      'Improving a heterogeneous graph transformer that links genes, variants and patients, and bringing in the SPARK cohort to grow the training data.',
  },
  {
    title: 'Arc Institute Virtual Cell Challenge',
    context: 'Competition, 2026',
    description:
      'Predicting what happens to a cell when a gene is knocked down, in cell lines the model has never seen.',
  },
]

export const FEATURED: Project = {
  name: 'Drug–ligand binding affinity predictor',
  area: 'Drug discovery',
  description:
    'Predicts how strongly a drug binds its target protein. Protein sequences go through ESM-2, ligands become molecular graphs, and five GNN variants are tested against XGBoost and random forest baselines.',
  stack: ['PyTorch Geometric', 'ESM-2', 'RDKit', 'XGBoost'],
  link: 'https://github.com/Sidharth6Shah/Drug-Affinity-Prediction-Project',
  linkLabel: 'Code on GitHub',
}

export const PROJECTS: Project[] = [
  {
    name: 'FragFlow',
    area: 'Generative chemistry',
    status: 'In progress',
    description:
      'A GFlowNet that assembles drug-like molecules one fragment at a time, rewarded on drug-likeness, ease of synthesis and solubility.',
    stack: ['torchgfn', 'PyTorch Geometric', 'ZINC250K'],
    link: 'https://github.com/Sidharth6Shah/fragflow',
    linkLabel: 'Code on GitHub',
  },
  {
    name: 'CardioGlasses',
    area: 'Wearables',
    status: 'MHacks 2026 track winner',
    description:
      'Glasses with heart and motion sensors that track heart metrics and raise alerts. Won the FinchNode HealthTech track. I built the layer that turns raw signals into decisions.',
    stack: ['PPG', 'IMU', 'FinchNode API'],
    link: 'https://github.com/tTong32/CardioGlasses',
    linkLabel: 'Code on GitHub',
  },
  {
    name: 'See-DR',
    area: 'Medical imaging',
    status: 'Paper at CUCAI 2026',
    description:
      'Finds several kinds of retinal lesions at once to help detect diabetic retinopathy, using our HydraLA-Net architecture. Built with my Wat.AI team.',
    stack: ['PyTorch', 'Segmentation'],
    link: '/blog/Progressive-Optimization-of-HydraLA-Net-for-Microaneurysm-Segmentation',
    linkLabel: 'Read the paper',
  },
  {
    name: 'PROTACForge',
    area: 'Drug discovery',
    status: 'In progress',
    description:
      'A pipeline for designing PROTAC degraders: prepare the building blocks, triage candidates in 2D, then sample how the three-part complex fits together.',
    stack: ['RDKit', 'PyTorch'],
  },
]

export const MORE_PROJECTS: ShortProject[] = [
  {
    name: 'Similar-property protein generator',
    description: 'ESM-2 suggests small edits that keep a protein’s properties',
    link: 'https://github.com/Sidharth6Shah/Antigen-Predictor-App',
  },
  {
    name: 'Diabetes prediction network',
    description: 'Predicts diabetes onset from routine health records',
    link: 'https://github.com/Sidharth6Shah/Diabetes-Prediction-with-FNNs',
  },
  {
    name: 'Mental health support chatbot',
    description: 'Retrieval-augmented chatbot on the OpenAI API',
    link: 'https://github.com/Sidharth6Shah/ai_therapist',
  },
  {
    name: 'Internship scraper',
    description: 'Checks company career pages for new internship postings',
    link: 'https://github.com/Sidharth6Shah/Internship-Scraper-System',
  },
]

export const WORK_EXPERIENCE: WorkExperience[] = [
  {
    company: 'The Centre for Applied Genomics, SickKids',
    title: 'Bioinformatics Software Research Student',
    detail: 'Scherer Lab, affiliated with Molecular Genetics at U of T',
    start: '2026',
    end: 'Now',
    current: true,
  },
  {
    company: 'LeapAP',
    title: 'Software Engineer Intern',
    detail: 'Web scraping',
    start: '2026',
    end: '2026',
    link: 'https://www.leapap.com',
  },
  {
    company: 'Bell Canada',
    title: 'Software Engineer Intern',
    detail: 'Full-stack',
    start: '2025',
    end: '2025',
    link: 'https://www.bell.ca',
  },
  {
    company: 'autonomik.ai',
    title: 'QA Engineer Intern',
    detail: 'Quality assurance',
    start: '2024',
    end: '2025',
    link: 'https://autonomik.ai',
  },
]

export const BLOG_POSTS: BlogPost[] = [
  {
    title: 'Predicting drug–protein binding affinity with graph neural networks',
    kind: 'Notes',
    description:
      'An end-to-end GNN pipeline, and what I learned about data splits, protein embeddings and molecular graphs.',
    link: '/blog/binding-affinity-research',
  },
  {
    title: 'Progressive optimization of HydraLA-Net for microaneurysm segmentation',
    kind: 'Paper',
    description:
      'Our Wat.AI team’s CUCAI 2026 paper: why we built it, how, and what the results mean.',
    link: '/blog/Progressive-Optimization-of-HydraLA-Net-for-Microaneurysm-Segmentation',
  },
  {
    title: 'HydraLA-Net: multi-lesion segmentation for diabetic retinopathy',
    kind: 'Notes',
    description:
      'Preprocessing, class imbalance and augmentation when segmenting several lesion types at once.',
    link: '/blog/HydraLA-Net:-Multi-Lesion-Segmentation-for-Diabetic-Retinopathy-Detection',
  },
]

export const SOCIAL_LINKS: SocialLink[] = [
  { label: 'GitHub', link: 'https://github.com/sidharth6shah' },
  { label: 'LinkedIn', link: 'https://www.linkedin.com/in/sidharth-shah-805911304/' },
  { label: 'X', link: 'https://x.com/sidharthkshah' },
]

export const EMAIL = 's78shah@uwaterloo.ca'
