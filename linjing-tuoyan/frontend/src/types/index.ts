export interface User {
  id: string;
  username: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  created_at: string;
}

export interface Case {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export interface Script {
  id: string;
  case_id: string;
  patient_info: {
    name: string;
    age: number;
    gender: 'male' | 'female';
    chief_complaint: string;
    medical_history: string[];
    vital_signs: VitalSigns;
  };
  scenes: ScriptScene[];
  total_dp_budget: number;
  created_at: string;
}

export interface ScriptScene {
  id: string;
  type: 'assessment' | 'diagnosis' | 'intervention' | 'evaluation';
  title: string;
  description: string;
  dp_cost: number;
  options?: SceneOption[];
  required_skills: string[];
  difficulty_modifier: number;
}

export interface SceneOption {
  id: string;
  content: string;
  dp_cost: number;
  is_optimal: boolean;
  consequence: string;
}

export interface VitalSigns {
  temperature: number;
  pulse: number;
  respiration: number;
  blood_pressure: {
    systolic: number;
    diastolic: number;
  };
  spo2: number;
}

export interface TrainingRecord {
  id: string;
  user_id: string;
  script_id: string;
  start_time: string;
  end_time?: string;
  current_scene_id?: string;
  decisions: Decision[];
  total_dp_spent: number;
  dp_budget: number;
  score: number;
  status: 'in_progress' | 'completed' | 'abandoned';
}

export interface Decision {
  scene_id: string;
  option_id?: string;
  voice_input?: string;
  emotional_state: EmotionalState;
  gesture_score?: number;
  timestamp: string;
  dp_spent: number;
}

export interface EmotionalState {
  tension_level: number;
  confidence_level: number;
  calmness_level: number;
}

export interface LearningProfile {
  user_id: string;
  overall_score: number;
  skills: SkillAssessment;
  weaknesses: string[];
  strengths: string[];
  recommended_cases: string[];
  training_history: {
    case_id: string;
    score: number;
    completed_at: string;
  }[];
  emotional_patterns: {
    average_tension: number;
    improvement_rate: number;
  };
}

export interface SkillAssessment {
  assessment: number;
  diagnosis: number;
  intervention: number;
  communication: number;
  emergency_response: number;
  documentation: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface MultimodalData {
  video_stream?: MediaStream;
  face_mesh_results?: any;
  hand_gesture_results?: any;
  pose_results?: any;
  audio_transcript?: string;
}
