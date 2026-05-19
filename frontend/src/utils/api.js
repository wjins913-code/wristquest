import { supabase } from './supabaseClient';

export async function saveAssessment(payload) {
  const { data, error } = await supabase
    .from('assessments')
    .insert({
      pain_score: payload.pain_score,
      function_score: payload.function_score,
      stability_score: payload.stability_score,
      overall_score: payload.overall_score,
      grade: payload.grade,
      survey_data: payload.survey_data,
      typing_data: payload.typing_data,
      mouse_data: payload.mouse_data,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function fetchAssessments(limit = 5) {
  const { data, error } = await supabase
    .from('assessments')
    .select('id, timestamp, pain_score, function_score, stability_score, overall_score, grade')
    .order('id', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
