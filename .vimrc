filetype off                  " required!
syntax on

set nocompatible              " be iMproved
set t_Co=256
set background=dark
set number
set autoindent
set smartindent
set wrap
set linebreak
set nolist
set incsearch
set showmatch
set expandtab
set showmode
set smartcase
set ruler
set tabstop=4
set shiftwidth=4
set colorcolumn=80
set mouse=a
set lazyredraw
set magic
set ignorecase
set smartcase
set incsearch
set backspace=eol,start,indent
set whichwrap+=<,>,[,]
set backupdir=~/.vim/tmp,.
set directory=~/.vim/tmp,.

set rtp+=~/.vim/bundle/vundle/
call vundle#rc()

" let Vundle manage Vundle
" required! 
Bundle 'gmarik/vundle'

" My bundles here:
"
" original repos on GitHub
Bundle 'tpope/vim-fugitive'
Bundle 'Lokaltog/vim-easymotion'
Bundle 'kien/ctrlp.vim'
Bundle 'scrooloose/nerdtree'
Bundle 'pangloss/vim-javascript'
Bundle 'hail2u/vim-css3-syntax'
Bundle 'scrooloose/syntastic'
Bundle 'tomasr/molokai'
Bundle 'bling/vim-airline'

" Map home and end keys
map <esc>OH <home>
cmap <esc>OH <home>
imap <esc>OH <home>
map <esc>OF <end>
cmap <esc>OF <end>
imap <esc>OF <end>

" Map indent and un-indent to shift tab
vmap <TAB> >gv
vmap <S-TAB> <gv
imap <S-TAB> <C-d>

colorscheme elflord 
highlight ColorColumn ctermbg=235

" vim-scripts repos
" Git repos on your local machine (i.e. when working on your own plugin)

filetype plugin indent on     " required!

" Close NerdTree if it's the only window open
map <C-n> :NERDTreeToggle<CR>
autocmd bufenter * if (winnr("$") == 1 && exists("b:NERDTreeType") && b:NERDTreeType == "primary") | q | endif

" Trim white space on save
autocmd BufWritePre *.py :%s/\s\+$//e

"
" Brief help
" :BundleList          - list configured bundles
" :BundleInstall(!)    - install (update) bundles
" :BundleSearch(!) foo - search (or refresh cache first) for foo
" :BundleClean(!)      - confirm (or auto-approve) removal of unused bundles
"
" see :h vundle for more details or wiki for FAQ
" NOTE: comments after Bundle commands are not allowed.


" Setup JS validation
let g:syntastic_javascript_checkers = ['jshint']
let g:syntastic_enable_signs=1
let g:syntastic_auto_loc_list=1
let g:syntastic_auto_jump = 1
let g:syntastic_always_populate_loc_list = 1
let g:syntastic_error_symbol = "!!"
let g:syntastic_check_on_open = 1
