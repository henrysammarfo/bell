-- BELL Gift Boxes — session-honest tokenized stock gifts (Neon / Postgres)

CREATE TABLE IF NOT EXISTS public.gift_boxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_code text NOT NULL UNIQUE,
  sender_user_id text NOT NULL,
  ticker text NOT NULL,
  symbol text,
  contract_address text,
  amount_usdt text NOT NULL,
  note text NOT NULL DEFAULT '',
  recipient_label text NOT NULL DEFAULT '',
  gate_decision text NOT NULL CHECK (gate_decision IN ('ALLOW', 'DENY', 'PENDING')),
  session_label text NOT NULL DEFAULT 'closed',
  gap_label text NOT NULL DEFAULT 'n/a',
  gap_mode boolean NOT NULL DEFAULT false,
  gap_acknowledged boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'ready'
    CHECK (status IN ('ready', 'gated_deny', 'wrapped', 'claimed', 'expired')),
  quote_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  wrap_detail text NOT NULL DEFAULT '',
  wrap_tx_hash text,
  claim_tx_hash text,
  claimer_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz,
  CONSTRAINT gift_ticker_length CHECK (char_length(ticker) BETWEEN 1 AND 16),
  CONSTRAINT gift_amount_length CHECK (char_length(amount_usdt) BETWEEN 1 AND 40),
  CONSTRAINT gift_note_length CHECK (char_length(note) <= 280),
  CONSTRAINT gift_claim_code_length CHECK (char_length(claim_code) BETWEEN 12 AND 64)
);

CREATE INDEX IF NOT EXISTS gift_boxes_sender_created_idx
  ON public.gift_boxes (sender_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS gift_boxes_status_idx
  ON public.gift_boxes (status);
