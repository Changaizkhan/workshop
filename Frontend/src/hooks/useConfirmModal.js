import { useState, useCallback } from 'react';

export function useConfirmModal() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);

  const close = useCallback(() => {
    if (loading) return;
    setState(null);
  }, [loading]);

  const openConfirm = useCallback(
    ({ title, message, confirmLabel = 'Delete', cancelLabel = 'Cancel', variant = 'danger', onConfirm }) => {
      setState({ type: 'confirm', title, message, confirmLabel, cancelLabel, variant, onConfirm });
    },
    [],
  );

  const openAlert = useCallback(({ title, message, confirmLabel = 'OK', variant = 'info' }) => {
    setState({ type: 'alert', title, message, confirmLabel, variant, onConfirm: null });
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!state) return;
    if (state.type === 'alert' || !state.onConfirm) {
      setState(null);
      return;
    }
    setLoading(true);
    try {
      await state.onConfirm();
      setState(null);
    } catch {
      setState(null);
    } finally {
      setLoading(false);
    }
  }, [state]);

  const modalProps = state
    ? {
        open: true,
        type: state.type,
        title: state.title,
        message: state.message,
        confirmLabel: state.confirmLabel,
        cancelLabel: state.cancelLabel,
        variant: state.variant,
        loading,
        onConfirm: handleConfirm,
        onClose: close,
      }
    : null;

  return { openConfirm, openAlert, close, modalProps };
}
