# Extension build configuration

- **string** basename  
  _Extension name_
- **string** [extends]  
  _Name of configuration to extend_
- **object** mapping
  - **object[]** copy  
    _Files to copy, retaining file name and directory path_
    - **string** dest  
      _Destination file path_
    - **string|string[]** src  
      _Source file path glob(s)_
  - **object[]** rename  
    _Files to copy, changing file name and directory path_
    - **string** dest  
      _Destination file path_
    - **string** src  
      _Source file path glob_
- **object** translations  
  _Translation file bundles_
  - **string** dest  
    _Destination directory path_
  - **string[]** src  
    _Source file paths glob_
- **object** webpack
  - **object** alias  
    _Module aliases_
  - **object[]** bundles  
    _JavaScript file bundles_
    - **string** dest  
      _Destination file path_
    - **boolean** [overwrite=`false`]  
      _If `true`, replaces any existing configuration, rather than adding to it_
    - **string[]** src  
      _Source file paths glob_
- **string** version  
  _Extension version string_
