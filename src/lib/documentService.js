import { supabase, supabaseConfigured } from './supabase';

const DOC_SELECT = 'id,title,content,owner_id,created_at,updated_at';

export async function listDocumentsForUser(userId) {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Add environment variables first.');
  }

  const { data: owned, error: ownedError } = await supabase
    .from('documents')
    .select(DOC_SELECT)
    .eq('owner_id', userId)
    .order('updated_at', { ascending: false });

  if (ownedError) throw ownedError;

  const { data: shares, error: shareError } = await supabase
    .from('document_shares')
    .select(`document_id, shared_with_user_id, documents (${DOC_SELECT})`)
    .eq('shared_with_user_id', userId);

  if (shareError) throw shareError;

  const shared = (shares || [])
    .map((row) => row.documents)
    .flat()
    .filter(Boolean)
    .map((doc) => ({
      ...doc,
      accessType: 'shared',
    }));

  return [
    ...(owned || []).map((doc) => ({ ...doc, accessType: 'owned' })),
    ...shared,
  ];
}

export async function createDocument({
  title,
  ownerId,
  content = '<p></p>',
}) {
  const { data, error } = await supabase
    .from('documents')
    .insert({
      title,
      owner_id: ownerId,
      content,
    })
    .select(DOC_SELECT)
    .single();

  if (error) throw error;

  return {
    ...data,
    accessType: 'owned',
  };
}

export async function updateDocument({ id, title, content }) {
  const { data, error } = await supabase
    .from('documents')
    .update({
      title,
      content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(DOC_SELECT)
    .single();

  if (error) throw error;

  return data;
}

export async function shareDocument({
  documentId,
  ownerId,
  sharedWithUserId,
}) {
  if (ownerId === sharedWithUserId) {
    throw new Error('You already own this document.');
  }

  const { error } = await supabase
    .from('document_shares')
    .upsert(
      {
        document_id: documentId,
        owner_id: ownerId,
        shared_with_user_id: sharedWithUserId,
      },
      {
        onConflict: 'document_id,shared_with_user_id',
      }
    );

  if (error) throw error;
}

export async function deleteDocumentForUser({
  documentId,
  userId,
  accessType,
}) {
  if (accessType === 'owned') {
    const { error: shareError } = await supabase
      .from('document_shares')
      .delete()
      .eq('document_id', documentId);

    if (shareError) throw shareError;

    const { error: docError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('owner_id', userId);

    if (docError) throw docError;

    return;
  }

  const { error } = await supabase
    .from('document_shares')
    .delete()
    .eq('document_id', documentId)
    .eq('shared_with_user_id', userId);

  if (error) throw error;
}