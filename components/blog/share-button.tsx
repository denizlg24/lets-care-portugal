"use client";

import { Check, Link2, Mail, Share2 } from "lucide-react";
import type { SVGProps } from "react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// lucide-react dropped brand glyphs, so we ship minimal inline brand marks.
function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <title>X</title>
      <path d="M18.9 1.6h3.5l-7.6 8.7L23.7 22h-7l-5.5-7.2L4.9 22H1.4l8.1-9.3L.7 1.6h7.2l5 6.6 5.9-6.6Zm-1.2 18.3h1.9L6.4 3.6H4.3l13.4 16.3Z" />
    </svg>
  );
}

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <title>Facebook</title>
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11.01 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8v8.44C19.61 23.08 24 18.09 24 12.07Z" />
    </svg>
  );
}

function LinkedinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <title>LinkedIn</title>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14Zm1.78 13.02H3.56V9h3.56v11.45ZM22.22 0H1.77C.8 0 0 .78 0 1.75v20.5C0 23.22.8 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.75V1.75C24 .78 23.2 0 22.22 0Z" />
    </svg>
  );
}

interface ShareButtonProps {
  url: string;
  title: string;
  excerpt?: string;
}

/**
 * Share control. Uses the native share sheet when available (mobile); otherwise
 * falls back to a menu of per-network share links plus copy-to-clipboard.
 */
export function ShareButton({ url, title, excerpt }: ShareButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const [canNativeShare, setCanNativeShare] = React.useState(false);

  React.useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedBody = encodeURIComponent(`${excerpt ? `${excerpt}\n\n` : ""}${url}`);

  const links = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedBody}`,
  };

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; ignore.
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, text: excerpt, url });
    } catch {
      // User dismissed the sheet; nothing to do.
    }
  }

  if (canNativeShare) {
    return (
      <Button variant="outline" size="sm" onClick={nativeShare}>
        <Share2 data-icon="inline-start" />
        Partilhar
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm">
            <Share2 data-icon="inline-start" />
            Partilhar
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          render={<a href={links.twitter} target="_blank" rel="noopener noreferrer" />}
        >
          <XIcon className="size-4" />X / Twitter
        </DropdownMenuItem>
        <DropdownMenuItem
          render={<a href={links.facebook} target="_blank" rel="noopener noreferrer" />}
        >
          <FacebookIcon className="size-4" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem
          render={<a href={links.linkedin} target="_blank" rel="noopener noreferrer" />}
        >
          <LinkedinIcon className="size-4" />
          LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem render={<a href={links.email} />}>
          <Mail />
          Email
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          closeOnClick={false}
          onClick={(event) => {
            event.preventDefault();
            copyLink();
          }}
        >
          {copied ? <Check className="text-primary" /> : <Link2 />}
          {copied ? "Link copiado" : "Copiar link"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
