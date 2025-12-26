# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.1].define(version: 2025_12_26_020803) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "children", force: :cascade do |t|
    t.string "name", null: false
    t.date "birthday"
    t.bigint "family_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["family_id"], name: "index_children_on_family_id"
  end

  create_table "diaries", force: :cascade do |t|
    t.date "date"
    t.bigint "user_id", null: false
    t.text "body"
    t.bigint "emoji_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["emoji_id"], name: "index_diaries_on_emoji_id"
    t.index ["user_id"], name: "index_diaries_on_user_id"
  end

  create_table "diary_children", force: :cascade do |t|
    t.bigint "diary_id", null: false
    t.bigint "child_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["child_id"], name: "index_diary_children_on_child_id"
    t.index ["diary_id"], name: "index_diary_children_on_diary_id"
  end

  create_table "emojis", force: :cascade do |t|
    t.string "character"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "category"
    t.index ["character"], name: "index_emojis_on_character", unique: true
  end

  create_table "families", force: :cascade do |t|
    t.string "name", null: false
    t.bigint "owner_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["owner_id"], name: "index_families_on_owner_id", unique: true
  end

  create_table "reactions", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "diary_id", null: false
    t.bigint "emoji_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["diary_id"], name: "index_reactions_on_diary_id"
    t.index ["emoji_id"], name: "index_reactions_on_emoji_id"
    t.index ["user_id", "diary_id", "emoji_id"], name: "index_reactions_on_user_id_and_diary_id_and_emoji_id", unique: true
    t.index ["user_id"], name: "index_reactions_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", null: false
    t.string "name"
    t.date "birthday"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "supabase_uid"
    t.bigint "family_id"
    t.index ["family_id"], name: "index_users_on_family_id"
    t.index ["supabase_uid"], name: "index_users_on_supabase_uid", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "children", "families"
  add_foreign_key "diaries", "emojis"
  add_foreign_key "diaries", "users"
  add_foreign_key "diary_children", "children"
  add_foreign_key "diary_children", "diaries"
  add_foreign_key "families", "users", column: "owner_id"
  add_foreign_key "reactions", "diaries"
  add_foreign_key "reactions", "emojis"
  add_foreign_key "reactions", "users"
  add_foreign_key "users", "families"
end
