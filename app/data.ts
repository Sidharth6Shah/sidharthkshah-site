type Project = {
  name: string
  description: string
  link: string
  video?: string
  id: string
}

type WorkExperience = {
  company: string
  title: string
  start: string
  end: string
  link: string
  id: string
}

type BlogPost = {
  title: string
  description: string
  link: string
  uid: string
}

type SocialLink = {
  label: string
  link: string
}

export const PROJECTS: Project[] = [
  {
    name: 'Drug-Ligand Affinity Predictor',
    description:
      'This repository features an XGBoost baseline, along with 5 independant GNN-variant models, aiming to predict the pKd value between a given drug and it\'s target protein.',
    link: 'https://github.com/Sidharth6Shah/Drug-Affinity-Prediction-Project',
    // video:
    //   'https://res.cloudinary.com/read-cv/video/upload/t_v_b/v1/1/profileItems/W2azTw5BVbMXfj7F53G92hMVIn32/newProfileItem/d898be8a-7037-4c71-af0c-8997239b050d.mp4?_a=DATAdtAAZAA0',
    id: 'project1',
  },
  {
    name: 'Diabetes Prediction FNN',
    description: 'Model that predicts diabetes onset based on several health parameters typically found in medical records.',
    link: 'https://github.com/Sidharth6Shah/Diabetes-Prediction-with-FNNs',
    // video:
    //   'https://res.cloudinary.com/read-cv/video/upload/t_v_b/v1/1/profileItems/W2azTw5BVbMXfj7F53G92hMVIn32/XSfIvT7BUWbPRXhrbLed/ee6871c9-8400-49d2-8be9-e32675eabf7e.mp4?_a=DATAdtAAZAA0',
    id: 'project2',
  },
  {
    name: 'Internship Scraper System',
    description: 'Scrapers to autocheck for company internship postings.',
    link: 'https://github.com/Sidharth6Shah/Internship-Scraper-System',
    // video:
    //   'https://res.cloudinary.com/read-cv/video/upload/t_v_b/v1/1/profileItems/W2azTw5BVbMXfj7F53G92hMVIn32/XSfIvT7BUWbPRXhrbLed/ee6871c9-8400-49d2-8be9-e32675eabf7e.mp4?_a=DATAdtAAZAA0',
    id: 'project5',
  },
  {
    name: 'RAG-Powered Chatbot for Mental Health Support',
    description: 'Pretty self explanatory 👍🏾.',
    link: 'https://github.com/Sidharth6Shah/ai_therapist',
    // video:
    //   'https://res.cloudinary.com/read-cv/video/upload/t_v_b/v1/1/profileItems/W2azTw5BVbMXfj7F53G92hMVIn32/XSfIvT7BUWbPRXhrbLed/ee6871c9-8400-49d2-8be9-e32675eabf7e.mp4?_a=DATAdtAAZAA0',
    id: 'project3',
  },
  {
    name: 'Similar Property Molecule Generator',
    description: 'Uses Meta\'s ESM-2 protein language model to tweak input protein and return a slightly modified one with a high likelihood of similar properties.',
    link: 'https://github.com/Sidharth6Shah/Antigen-Predictor-App',
    // video:
    //   'https://res.cloudinary.com/read-cv/video/upload/t_v_b/v1/1/profileItems/W2azTw5BVbMXfj7F53G92hMVIn32/XSfIvT7BUWbPRXhrbLed/ee6871c9-8400-49d2-8be9-e32675eabf7e.mp4?_a=DATAdtAAZAA0',
    id: 'project4',
  },
  // {
  //   name: 'Motion Primitives3',
  //   description: 'UI kit to make beautiful, animated interfaces.',
  //   link: 'https://motion-primitives.com/',
  //   video:
  //     'https://res.cloudinary.com/read-cv/video/upload/t_v_b/v1/1/profileItems/W2azTw5BVbMXfj7F53G92hMVIn32/XSfIvT7BUWbPRXhrbLed/ee6871c9-8400-49d2-8be9-e32675eabf7e.mp4?_a=DATAdtAAZAA0',
  //   id: 'project5',
  // },
]

export const WORK_EXPERIENCE: WorkExperience[] = [
  {
    company: 'LeapAP',
    title: 'Software Engineer Intern',
    start: '2026',
    end: 'Present',
    link: 'https://www.leapap.com',
    id: 'work1',
  },
  {
    company: 'Bell Canada',
    title: 'Software Engineer Intern',
    start: '2025',
    end: '2025',
    link: 'https://www.bell.ca',
    id: 'work2',
  },
  {
    company: 'autonomik.ai',
    title: 'QA Engineer Intern',
    start: '2024',
    end: '2025',
    link: 'https://autonomik.ai',
    id: 'work3',
  },
  //https://ibelick.com
]

export const BLOG_POSTS: BlogPost[] = [
  // {
  //   title: 'Exploring the Intersection of Design, AI, and Design Engineering',
  //   description: 'How AI is changing the way we design',
  //   link: '/blog/exploring-the-intersection-of-design-ai-and-design-engineering',
  //   uid: 'blog-1',
  // },
  // {
  //   title: 'Why I left my job to start my own company',
  //   description:
  //     'A deep dive into my decision to leave my job and start my own company',
  //   link: '/blog/exploring-the-intersection-of-design-ai-and-design-engineering',
  //   uid: 'blog-2',
  // },
  // {
  //   title: 'What I learned from my first year of freelancing',
  //   description:
  //     'A look back at my first year of freelancing and what I learned',
  //   link: '/blog/exploring-the-intersection-of-design-ai-and-design-engineering',
  //   uid: 'blog-3',
  // },
  // {
  //   title: 'How to Export Metadata from MDX for Next.js SEO',
  //   description: 'A guide on exporting metadata from MDX files to leverage Next.js SEO features.',
  //   link: '/blog/example-mdx-metadata',
  //   uid: 'blog-4',
  // },
]

export const SOCIAL_LINKS: SocialLink[] = [
  {
    label: 'Github',
    link: 'https://github.com/sidharth6shah',
  },
  // {
  //   label: 'Twitter',
  //   link: 'https://twitter.com/ibelick',
  // },
  {
    label: 'LinkedIn',
    link: 'https://www.linkedin.com/in/sidharth-shah-805911304/',
  },
  // {
  //   label: 'Instagram',
  //   link: 'https://www.instagram.com/ibelick',
  // },
]

export const EMAIL = 's78shah@uwaterloo.ca'
