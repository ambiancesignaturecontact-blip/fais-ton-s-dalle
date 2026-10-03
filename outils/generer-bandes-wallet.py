# Génère les bandes de la carte de fidélité, en trois résolutions.
#
# ⚠️ DEUX PIÈGES, les deux rencontrés pour de vrai :
#
# 1. Les champs d'une « storeCard » s'affichent PAR-DESSUS la
#    bande. La première version mettait du texte dans les deux :
#    « 10 menus » venait se coller sur le visuel. → plus aucun
#    champ d'en-tête ni principal, la bande porte tout.
#
# 2. `strip.png` est la version @1x : 375 × 144 points. On y avait
#    mis l'image 750 × 246. iOS la considérait donc comme deux fois
#    trop large et la **rognait** — d'où « c'est coupé ».
#    Il faut les trois tailles :
#       strip.png     375 × 144
#       strip@2x.png  750 × 288
#       strip@3x.png 1125 × 432
#
# La composition est dessinée en proportions, puis rendue aux trois
# tailles : aucune déformation, aucun recadrage.
#
# Par prudence, rien d'important ne dépasse dans les 12 % du haut
# et du bas : certains iPhone affichent la bande un peu plus courte.

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os, io, base64

BASE_L, BASE_H = 1125, 432          # on dessine en @3x, on réduit ensuite
TAILLES = {
    "strip.png":    (375, 144),
    "strip@2x.png": (750, 288),
    "strip@3x.png": (1125, 432),
}

HAUT    = (172, 21, 27)
BAS     = (88, 7, 11)
CREME   = (255, 250, 242)
OR      = (231, 184, 102)
OR_PALE = (248, 223, 174)
ROSE    = (255, 199, 188)


def police(taille, gras=True):
    c = ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if gras
         else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
    return ImageFont.truetype(c, taille) if os.path.exists(c) else ImageFont.load_default()


def fond():
    """Grenat profond, halo doux, filets dorés : un air de carte."""
    im = Image.new("RGB", (BASE_L, BASE_H), HAUT)
    d = ImageDraw.Draw(im)
    for y in range(BASE_H):
        t = (y / BASE_H) ** 1.2
        d.line([(0, y), (BASE_L, y)],
               fill=tuple(int(HAUT[i] + (BAS[i] - HAUT[i]) * t) for i in range(3)))

    halo = Image.new("L", (BASE_L, BASE_H), 0)
    ImageDraw.Draw(halo).ellipse([-280, -400, 660, 300], fill=44)
    halo = halo.filter(ImageFilter.GaussianBlur(110))
    im.paste(Image.new("RGB", (BASE_L, BASE_H), (255, 238, 218)), (0, 0), halo)

    d.rectangle([0, 0, BASE_L, 5], fill=OR)                 # filet haut
    d.rectangle([0, BASE_H - 3, BASE_L, BASE_H], fill=(60, 4, 7))
    return im


def tampon(d, cx, cy, r, rempli):
    if rempli:
        d.ellipse([cx - r - 2, cy - r + 4, cx + r + 2, cy + r + 7], fill=(62, 5, 8))
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=OR)
        d.ellipse([cx - r + 8, cy - r + 8, cx + r - 8, cy + r - 8], fill=OR_PALE)
    else:
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=ROSE, width=3)


def composer(n: int) -> Image.Image:
    im = fond()
    d = ImageDraw.Draw(im)
    marge = 62

    # ─── Tout est centré verticalement ────────────────────────
    #
    # Certains iPhone affichent la bande un peu plus courte et la
    # rognent en haut et en bas, à parts égales. Composition
    # centrée = rien d'important ne disparaît.
    d.text((marge, 112), "FIDÉLITÉ", font=police(27), fill=OR)

    if n >= 10:
        d.text((marge, 150), "MENU", font=police(74), fill=CREME)
        d.text((marge, 224), "OFFERT", font=police(74), fill=OR)
        d.text((marge + 3, 316), "à votre prochaine commande",
               font=police(28, False), fill=OR_PALE)
    else:
        f = police(100)
        d.text((marge, 150), str(n), font=f, fill=CREME)
        larg = d.textlength(str(n), font=f)
        d.text((marge + larg + 12, 208), "/ 10", font=police(42), fill=ROSE)
        reste = 10 - n
        d.text((marge + 3, 286),
               f"encore {reste} menu{'s' if reste > 1 else ''} avant le menu offert",
               font=police(31, False), fill=OR_PALE)

    # ─── Droite : les dix tampons, deux rangées ────────────────
    r, pas = 26, 76
    x0 = BASE_L - marge - 4 * pas - r
    for i in range(10):
        tampon(d, x0 + (i % 5) * pas, 196 + (i // 5) * 100, r, i < n)

    return im


def images(n: int) -> dict[str, bytes]:
    """Les trois résolutions, optimisées."""
    grand = composer(n)
    out = {}
    for nom, (l, h) in TAILLES.items():
        im = grand.resize((l, h), Image.LANCZOS)
        p = im.convert("P", palette=Image.ADAPTIVE, colors=64)
        buf = io.BytesIO()
        p.save(buf, "PNG", optimize=True)
        out[nom] = buf.getvalue()
    return out


if __name__ == "__main__":
    total = 0
    for n in range(11):
        tailles = images(n)
        poids = sum(len(v) for v in tailles.values())
        total += poids
        print(f"  {n:2d} tampons → {poids/1024:5.1f} Ko "
              f"({', '.join(f'{k} {len(v)//1024}Ko' for k, v in tailles.items())})")
    print(f"  total : {total/1024:.1f} Ko")
