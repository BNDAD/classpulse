// src/app/api/documents/revisions/route.ts — 멘토 수정본 제안 API
import { NextRequest } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// GET: 문서의 수정본 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: '인증 필요' }, { status: 401 });

    const documentId = request.nextUrl.searchParams.get('documentId');
    if (!documentId) return Response.json({ error: 'documentId 필요' }, { status: 400 });

    const serviceClient = createServiceClient();

    // 문서 소유권 확인 (학생은 본인 문서, 멘토는 전체 접근)
    const { data: doc } = await serviceClient
      .from('documents')
      .select('user_id')
      .eq('id', documentId)
      .single();

    if (!doc) return Response.json({ error: '문서를 찾을 수 없습니다.' }, { status: 404 });

    const { data: profile } = await serviceClient
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isMentor = profile?.role && ['MENTOR', 'CAREER_ADVISOR', 'ADMIN'].includes(profile.role);
    if (!isMentor && doc.user_id !== user.id) {
      return Response.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    const { data: revisions } = await serviceClient
      .from('document_revisions')
      .select('*, mentor:user_profiles!document_revisions_mentor_id_fkey(name, role)')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false });

    return Response.json({ revisions: revisions || [] });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST: 멘토가 수정본 제안
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: '인증 필요' }, { status: 401 });

    const serviceClient = createServiceClient();

    // 멘토 권한 확인
    const { data: profile } = await serviceClient
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['MENTOR', 'CAREER_ADVISOR', 'ADMIN'].includes(profile.role)) {
      return Response.json({ error: '멘토만 수정본을 제안할 수 있습니다.' }, { status: 403 });
    }

    const { documentId, originalContent, revisedContent, revisionNotes, sectionIndex } = await request.json();

    if (!documentId || !revisedContent) {
      return Response.json({ error: '필수 항목 누락' }, { status: 400 });
    }

    // 수정본 저장
    const { data: revision, error } = await serviceClient
      .from('document_revisions')
      .insert({
        document_id: documentId,
        mentor_id: user.id,
        original_content: originalContent || '',
        revised_content: revisedContent,
        revision_notes: revisionNotes || null,
        section_index: sectionIndex ?? null,
        status: 'PENDING',
      })
      .select()
      .single();

    if (error) throw error;

    // 문서 상태 업데이트
    await serviceClient
      .from('documents')
      .update({ status: 'MENTOR_REVIEW' })
      .eq('id', documentId);

    // 학생에게 알림 전송
    const { data: doc } = await serviceClient
      .from('documents')
      .select('user_id, title')
      .eq('id', documentId)
      .single();

    if (doc) {
      await serviceClient.from('notifications').insert({
        user_id: doc.user_id,
        type: 'FEEDBACK',
        title: '멘토 수정본 도착',
        content: `"${doc.title}" 문서에 대한 멘토 수정본이 도착했습니다. 확인해보세요!`,
        metadata: { documentId, revisionId: revision.id },
      });
    }

    return Response.json({ success: true, revision });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: 학생이 수정본 수락/거절
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: '인증 필요' }, { status: 401 });

    const { revisionId, status, studentResponse } = await request.json();

    if (!revisionId || !['ACCEPTED', 'REJECTED'].includes(status)) {
      return Response.json({ error: '유효하지 않은 요청' }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    const { error } = await serviceClient
      .from('document_revisions')
      .update({
        status,
        student_response: studentResponse || null,
      })
      .eq('id', revisionId);

    if (error) throw error;

    // 수락한 경우 문서 내용 업데이트
    if (status === 'ACCEPTED') {
      const { data: revision } = await serviceClient
        .from('document_revisions')
        .select('document_id, revised_content')
        .eq('id', revisionId)
        .single();

      if (revision) {
        await serviceClient
          .from('documents')
          .update({
            content: revision.revised_content,
            status: 'COMPLETED' as const,
          })
          .eq('id', revision.document_id);

        // version 증가
        const { data: doc } = await serviceClient
          .from('documents')
          .select('version')
          .eq('id', revision.document_id)
          .single();

        if (doc) {
          await serviceClient
            .from('documents')
            .update({ version: (doc.version || 1) + 1 })
            .eq('id', revision.document_id);
        }
      }
    }

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
