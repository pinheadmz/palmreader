######### Builder stage #########
FROM node:18-bookworm AS builder

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     python3 \
     python3-venv \
     make \
     g++ \
     build-essential \
     pkg-config \
     libusb-1.0-0-dev \
     libudev-dev \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci \
  && python3 -m venv /tmp/venv-palmreader \
  && . /tmp/venv-palmreader/bin/activate \
  && pip install --upgrade pip setuptools wheel \
  && npm install node-hid --build-from-source

# Copy source and build 
COPY . .

# The repo provided `npm run build` to create an executable via `pkg`.
# If there is no `build` script, this command will harmlessly exit (see fallback below).
RUN if [ -f package.json ] && grep -q "\"build\"" package.json; then \
      npm run build; \
    else \
      echo "no build script, skipping npm run build"; \
    fi

######### Runtime stage #########
FROM node:18-bookworm-slim

# Install dependencies
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     xclip \
     libusb-1.0-0 \
     libudev1 \
  && rm -rf /var/lib/apt/lists/*


WORKDIR /root

# Copy application files from builder
COPY --from=builder /app /root

# Install only production deps for smaller image
RUN npm ci --only=production || true 

ENV NODE_ENV=production

# Use -it when running the container to attach a TTY: `docker run -it --rm palmreader`
ENTRYPOINT ["/root/build/palmreader"]

# --- Notes ---
# 1) Building an executable: using `pkg` to build a self-contained executable which will land in `build/`.
#
# 2) Ledger hardware access: if you need to access Ledger devices from the container you will also need
#    to: a) map USB devices into the container and b) run with privileged or appropriate device permissions,
#    and c) configure udev rules on the host. The README documents Ledger prerequisites.
#
# 3) To build the image locally:
#    docker build -t palmreader .
#
# 4) Interactive run example with TTY and persistent data directory:
#    docker run -it --rm -v "$HOME/.config/hsd_data:/root/.hsd" palmreader