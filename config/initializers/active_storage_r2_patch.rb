require "active_storage/service/s3_service"

module ActiveStorageR2Patch
  def upload(key, io, checksum: nil, **options)
    # R2はMD5チェックサムでエラーを出すことがあるため、
    # アップロード時のチェックサムを明示的に無視する
    super(key, io, checksum: nil, **options)
  end
end

ActiveStorage::Service::S3Service.prepend(ActiveStorageR2Patch)