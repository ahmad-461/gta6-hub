-- Add foreign key constraint from articles.category to categories.id if both tables exist and column is compatible
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'articles'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories'
  ) THEN
    -- Check if constraint already exists
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'fk_articles_category'
    ) THEN
      -- Safely add foreign key constraint if existing values match
      BEGIN
        ALTER TABLE public.articles
          ADD CONSTRAINT fk_articles_category
          FOREIGN KEY (category)
          REFERENCES public.categories(id)
          ON DELETE SET NULL;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE NOTICE 'Could not add foreign key constraint fk_articles_category automatically: %', SQLERRM;
      END;
    END IF;
  END IF;
END $$;
