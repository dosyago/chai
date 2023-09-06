#!/bin/sh

# Check if xelatex is installed and set Pandoc options accordingly
if command -v xelatex > /dev/null 2>&1; then
  pandoc_options="--pdf-engine=xelatex"
else
  echo "xelatex is not installed, proceeding without it." >&2
  pandoc_options=""
fi

# Verify if a file path is provided
if [ -z "$1" ]; then
  echo "No file path provided. Exiting." >&2
  exit 1
fi

# Verify if the file exists
if [ ! -f "$1" ]; then
  echo "File does not exist. Exiting." >&2
  exit 1
fi

echo "$1"

base="$2"
format="$3"

# Set default format to png if none is provided
if [ -z "$format" ]; then
  format="png"
fi

convert_to_pdf() {
  local input_file="$1"
  shift
  local output_file="$1"
  shift
  local options=("$@")

  pandoc "${options[@]}" "$input_file" -o "$output_file"
}
convert_to_pdf_if_needed() {
  # Extract the file extension
  file_extension="${1##*.}"

  if [ "$file_extension" = "$1" ]; then
    file_extension=""
  fi

  # Output file name (same as input but with .pdf extension)
  output_file="${1%.*}.pdf"

  # Convert files based on their extension
  case "$file_extension" in
    "json")
      echo "Converting JSON to PDF..." >&2
      options_array=(--from=json $pandoc_options)
      convert_to_pdf "$1" "$output_file" "${options_array[@]}"
      ;;
    "rst")
      echo "Converting RST to PDF..." >&2
      options_array=(--from=rst $pandoc_options)
      convert_to_pdf "$1" "$output_file" "${options_array[@]}"
      ;;
    "conf"|"yaml"|"sh"|"text"|"txt"|"c"|"js"|"cpp"|"h"|"tpp"|"hpp"|"py"|"pl"|"m"|"java"|"go"|"cjs"|"mjs"|"css"|"")
      echo "Converting TXT to PDF (via latex listings in Bera Mono)..." >&2
      latex=$(mktemp -d)
      cat <<TAO > "$latex/file.tex"
\documentclass{article}
\usepackage[left=2cm,right=1cm,top=2cm,bottom=2cm]{geometry} % Adjust the global margin
\usepackage{listings}
\usepackage{beramono}

\lstset{
  language={},
  basicstyle=\ttfamily\large,
  linewidth=40cm,
  breaklines=true,                 % Enable line breaking
  breakatwhitespace=false          % Break also at non-white space characters if required
}

\begin{document}
\pagestyle{empty}  % Remove page numbers

\lstinputlisting{"$1"}

\end{document}
TAO
      pdflatex --output-directory "$latex" file.tex 1>&2
      mv "${latex}/file.pdf" "${output_file}" 
      rm -rf "$latex"
      ;;
    "me"|"md")
      echo "Converting Markdown (GFM) to PDF..." >&2
      options_array=(--from=gfm $pandoc_options)
      convert_to_pdf "$1" "$output_file" "${options_array[@]}"
      ;;
    "htm"|"html")
      echo "Converting HTML to PDF..." >&2
      options_array=($pandoc_options)
      convert_to_pdf "$1" "$output_file" "${options_array[@]}"
      ;;
    *)
      echo "File doesn't need conversion to PDF." >&2
      output_file="$1"
      ;;
  esac
  # Return the output file name (either the original or the converted PDF)
  echo "$output_file"
}

# Main Script Execution
converted_file=$(convert_to_pdf_if_needed "$1")
cp "$base/index.html" "$1.html"

convert -verbose -density 120 -background ivory -alpha remove -alpha off -quality 75% -strip -interlace Plane "${converted_file}" +adjoin "${1}-%04d.${format}" || (mutool draw -i -o "${1}-%04d.${format}" "${converted_file}" && "$base/../../scripts/rename_1_based.sh" "${1}" "$format")

cp "$1" "$base/../../pdfs/"

