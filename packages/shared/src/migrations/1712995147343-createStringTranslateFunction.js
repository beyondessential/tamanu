/** @typedef {import('sequelize').QueryInterface} QueryInterface */

/**
 * @param {QueryInterface} query
 */
export async function up(query) {
  await query.sequelize.query(`CREATE OR REPLACE FUNCTION public.string_translate(
      i_language text,
      i_string_id text,
      i_fallback_string text,
      i_replacements json
  )
  RETURNS text AS $$
  declare
    translated_string text;
      key_name text;
      key_value text;
  begin
    select text into translated_string from translated_strings where language = i_language and string_id = i_string_id;

    if translated_string is null or translated_string = ''
      then translated_string = i_fallback_string;
    end if;

      -- Loop through each key-value pair in the JSON object
      FOR key_name, key_value IN SELECT * FROM json_each_text(i_replacements) LOOP
          -- Replace placeholders in the input string
          translated_string := REPLACE(translated_string, ':' || key_name, key_value);
      END LOOP;

      RETURN translated_string;
  END;
  $$ LANGUAGE plpgsql;`);
}

/**
 * @param {QueryInterface} query
 */
export async function down(query) {
  await query.sequelize.query(`DROP FUNCTION public.string_translate(text, text, text, json);`);
}
