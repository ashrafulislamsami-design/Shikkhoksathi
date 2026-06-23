// TypeScript interfaces and mock data for Career Guidance Dashboard

export type SkillCategory = "Soft Skills" | "Hard Skills";
export type SkillPriority = "HIGH" | "MEDIUM" | "LOW";

export interface SkillMetric {
  name: string;
  category: SkillCategory;
  currentLevel: number; // 0-100 (Blue bar)
  targetLevel: number;  // 0-100 (Green bar)
  recommendations: string[];
}

export interface RoadmapStep {
  stepNumber: number;
  title: string;
  tag: "SSC/HSC" | "Training" | "Employment" | string;
  duration: string;
  requirements: string[];
  resources: string[];
}

export interface CareerRoadmap {
  title: string;
  matchScore: number; // percentage
  salaryRange: { min: number; max: number };
  demandLevel: "Low" | "Medium" | "High";
  steps: RoadmapStep[];
}

// Logic implementations
export const calculateGap = (current: number, target: number): number => {
  return target - current;
};

export const getPriority = (gap: number): SkillPriority => {
  if (gap > 40) return "HIGH";
  if (gap >= 20) return "MEDIUM";
  return "LOW";
};

export const formatTaka = (amount: number): string => {
  return `৳${amount.toLocaleString("en-BD")}`;
};

// Mock Data Scenario: Vocational/Technical Career
export const mockCareerData: {
  skills: SkillMetric[];
  roadmap: CareerRoadmap;
} = {
  skills: [
    {
      name: "Communication",
      category: "Soft Skills",
      currentLevel: 75,
      targetLevel: 85,
      recommendations: [
        "Participate in group discussions at Technical Institutes",
        "Practice workplace communication scenarios",
        "Listen to professional podcasts on public speaking"
      ]
    },
    {
      name: "Web Development",
      category: "Hard Skills",
      currentLevel: 25,
      targetLevel: 80,
      recommendations: [
        "Enroll in an online HTML/CSS/JS program",
        "Complete a 6-month NSDA certified web design course",
        "Build a personal portfolio project"
      ]
    },
    {
      name: "Problem Solving",
      category: "Soft Skills",
      currentLevel: 45,
      targetLevel: 80,
      recommendations: [
        "Join a coding club or robotics team",
        "Practice logic puzzles and algorithmic challenges",
        "Read books on creative problem solving"
      ]
    },
    {
      name: "Electrical Systems",
      category: "Hard Skills",
      currentLevel: 30,
      targetLevel: 75,
      recommendations: [
        "Visit a local technical workshop",
        "Enroll in a basic electronics course",
        "Practice safe handling of electrical components"
      ]
    }
  ],
  roadmap: {
    title: "Vocational/Technical Career Path",
    matchScore: 70,
    salaryRange: { min: 15000, max: 35000 },
    demandLevel: "High",
    steps: [
      {
        stepNumber: 1,
        title: "Complete Secondary Education",
        tag: "SSC/HSC",
        duration: "2-5 years",
        requirements: ["SSC Certificate", "Age 15+"],
        resources: ["Local Schools", "NCTB Curriculum Guides"]
      },
      {
        stepNumber: 2,
        title: "NSDA Vocational Training",
        tag: "Training",
        duration: "6-12 months",
        requirements: ["SSC Certificate", "Technical Aptitude"],
        resources: ["NSDA Job Board", "Technical Institutes of Bangladesh", "Apprenticeships"]
      },
      {
        stepNumber: 3,
        title: "Skilled Worker Position",
        tag: "Employment",
        duration: "Immediate",
        requirements: ["NSDA Level 2/3 Certification", "Practical Exam Pass"],
        resources: ["Local Job Markets", "Industry Networking Events", "BIDA Investment Portal"]
      }
    ]
  }
};
